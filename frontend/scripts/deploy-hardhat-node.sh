#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../contracts/animalcare-hardhat" && pwd)

echo "Compiling & deploying contracts to local Hardhat node..."
pushd "$ROOT_DIR" > /dev/null
npx hardhat compile
npx hardhat deploy --network hardhat
popd > /dev/null

echo "Deployment artifacts ready."

