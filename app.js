// Import required modules
const fs = require('fs');
const Web3 = require('web3');
const express = require('express');
const client = require('prom-client');
const fetch = require('node-fetch');
const winston = require('winston');

// Set up logger using Winston for logging information and errors
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, meta }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message} ${meta ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ],
});

// Load configuration from config.json file
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const automations = config.automations; // List of automation configurations

const chainlinkAPI = "https://automation.chain.link/api/query";

// Set up Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Define Prometheus gauge metrics with labels
const balanceMetric = new client.Gauge({
  name: 'current_contract_balance',
  help: 'Current LINK balance of the automation',
  labelNames: ['automation_name', 'automation_id']
});
register.registerMetric(balanceMetric);

const minBalanceMetric = new client.Gauge({
  name: 'min_contract_balance',
  help: 'Minimum LINK balance of the automation',
  labelNames: ['automation_name', 'automation_id']
});
register.registerMetric(minBalanceMetric);

const roundsPrepaidMetric = new client.Gauge({
  name: 'rounds_prepaid',
  help: 'Number of rounds prepaid based on balance and minimum balance for automation',
  labelNames: ['automation_name', 'automation_id']
});
register.registerMetric(roundsPrepaidMetric);

const statusMetric = new client.Gauge({
  name: 'automation_status',
  help: 'Status of the automation',
  labelNames: ['automation_name', 'automation_id']
});
register.registerMetric(statusMetric);

// Set up Express application
const app = express();
const port = config.port; // Port from config

// Function to fetch automation data from Chainlink API
async function fetchAutomationData(automation) {
  const variables = JSON.stringify({
    id: automation.AUTOMATION_ID,
    network: automation.NETWORK,
    registryAddress: automation.REGISTRY_ADDRESS,
    registrarAddress: automation.REGISTRAR_ADDRESS
  });

  const encodedVariables = encodeURIComponent(variables);

  try {
    const response = await fetch(`${chainlinkAPI}?query=NEW_UPKEEP_QUERY&variables=${encodedVariables}`, {
      method: "GET",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error(`Error fetching data for automation ${automation.AUTOMATION_ID}:`, { error: error.message });
    throw error;
  }
}

// Function to update Prometheus metrics with fetched data
function updateMetrics(data, automation) {
  const automationData = data.data.allKeepersNewUpkeepRegistrations.nodes[0];
  const balanceData = data.data.allKeepersNewUpkeepBalances.nodes[0];
  const statusData = data.data.allKeepersNewUpkeeps.nodes[0];

  const automationName = automationData.name;
  const balanceInWei = balanceData.balance;
  const minBalanceInWei = balanceData.minBalance;
  const status = statusData.status;

  // Convert from Wei to Ether
  const balanceInEther = Number(Web3.utils.fromWei(balanceInWei, 'ether'));
  const minBalanceInEther = Number(Web3.utils.fromWei(minBalanceInWei, 'ether'));

  // Calculate rounds prepaid and round down to the nearest whole number
  const roundsPrepaid = Math.floor(balanceInEther / minBalanceInEther);

  logger.info(`Automation: ${automationName} - Balance in LINK: ${balanceInEther}, Minimum Balance in LINK: ${minBalanceInEther}, Rounds Prepaid: ${roundsPrepaid}, Status: ${status}`);

  // Update metrics for the upkeep
  balanceMetric.labels(automationName, automation.AUTOMATION_ID).set(balanceInEther);
  minBalanceMetric.labels(automationName, automation.AUTOMATION_ID).set(minBalanceInEther);
  roundsPrepaidMetric.labels(automationName, automation.AUTOMATION_ID).set(roundsPrepaid);

  // Set status metric
  statusMetric.labels(automationName, automation.AUTOMATION_ID).set(status === 'ACTIVE' ? 1 : 0);
}

// Define route to expose metrics
app.get('/metrics', async (req, res) => {
  try {
    // Fetch data for each automation and handle errors individually
    const fetchPromises = automations.map(async (automation) => {
      try {
        const data = await fetchAutomationData(automation);
        updateMetrics(data, automation);
      } catch (error) {
        logger.error(`Failed to update metrics for automation ${automation.AUTOMATION_ID}:`, { error: error.message });
      }
    });

    // Wait for all fetches to complete
    await Promise.all(fetchPromises);

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error fetching data:', { error: error.message });
    res.status(500).send('Error fetching data');
  }
});

// Start the Express server
app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});
