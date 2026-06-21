#!/usr/bin/env bash

# Alfred Linux/macOS AI Workstation Local Bootstrapper
# Color Codes for crisp UX
GREEN='\033[0;32m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${PURPLE}================================================================${NC}"
echo -e "${PURPLE}          ALFRED CYBER WORKSTATION - LOCAL INITIALIZATION       ${NC}"
echo -e "${PURPLE}================================================================${NC}"

# Step 1: Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[-] Error: Node.js is not installed on this machine!${NC}"
    echo -e "    Please download and install Node.js (v18 or higher) from: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}[✓] Node.js environment verified: ${NODE_VERSION}${NC}"

# Step 2: Check for yarn or npm
if command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    echo -e "${RED}[-] Error: NPM is missing! Please re-install Node.js properly.${NC}"
    exit 1
fi

# Step 3: Install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}[*] Node modules folder empty. Bootstrapping workspace dependencies...${NC}"
    $PKG_MANAGER install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[-] Standard dependency alignment failed. Try running 'npm install --legacy-peer-deps' manually.${NC}"
        exit 1
    fi
    echo -e "${GREEN}[✓] Dependencies downloaded completely.${NC}"
else
    echo -e "${GREEN}[✓] Local dependencies cache detected.${NC}"
fi

# Step 4: Run local environment compilation
echo -e "${CYAN}[*] Compiling workspace and bundler modules...${NC}"
$PKG_MANAGER run build
if [ $? -ne 0 ]; then
    echo -e "${RED}[-] Local build process failed! Make sure you aren't running inside a restricted directory.${NC}"
    exit 1
fi
echo -e "${GREEN}[✓] Alfred workstation compilation succeeded!${NC}"

# Step 5: Start the local system
echo -e "${GREEN}[✓] Workstation live link initialized!${NC}"
echo -e "${CYAN}[*] Launching Alfred Cyber Server. Access the HUD inside your browser here:${NC}"
echo -e "${PURPLE}    >>>  http://localhost:3000  <<<${NC}"
echo -e "${YELLOW}Keep this terminal open to log local automation tasks.${NC}"
echo -e "${PURPLE}----------------------------------------------------------------${NC}"

$PKG_MANAGER start
