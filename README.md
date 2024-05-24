
# Chainlink Automation Poller

This application monitors Chainlink automation balances on Chainlink Automation enabled networks, fetching data and exposing it as Prometheus metrics.

## Prerequisites

- Node.js (version 20.x or later)
- npm (version 10.x or later)
- Prometheus
- jq
- Docker
- Docker Compose

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/Matrixed-Link/chainlink-automation-poller.git
    cd chainlink-automation-poller
    ```

2. Install the required dependencies:
    ```sh
    npm install
    ```

3. Copy the example configuration file and update it with your automation details:
    ```sh
    cp config.json.example config.json
    ```

4. Update `config.json` with your specific automation IDs, network details, and registry/registrar addresses.

## Running the Application

### Using Node.js

Start the application using Node.js:
```sh
npm run start
```

The application will start a server on the port specified in `config.json` (default is 8080). Metrics will be available at `http://localhost:8080/metrics`.

### Using Docker

Build and run the application using Docker and Docker Compose:

1. Build the Docker image:
    ```sh
    docker compose build
    ```

2. Start the application:
    ```sh
    docker compose up
    ```

The application will start a server on the port specified in `config.json` (default is 8080). Metrics will be available at `http://localhost:8080/metrics`.

## Metrics

The following metrics are exposed:

- `current_contract_balance`: Current LINK balance of the automation
- `min_contract_balance`: Minimum LINK balance of the automation
- `rounds_prepaid`: Number of rounds prepaid based on balance and minimum balance for automation
- `automation_status`: Status of the automation (1 for ACTIVE, 0 for INACTIVE)

## Logging

Logs are generated using Winston and can be found in the `app.log` file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes or improvements.

## License

This project is licensed under the MIT License.
