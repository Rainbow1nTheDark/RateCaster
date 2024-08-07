# Rate Caster Main Application

## Introduction

Rate Caster is a decentralized application (Dapp) built on the Base blockchain, designed to enhance transparency and trust within the Web3 ecosystem. This directory contains the core application, which includes the website and the smart contracts. The app is built using Scaffold-ETH 2, an open-source toolkit for building Dapps on the Ethereum blockchain.

## Why Rate Caster?

The Web3 space is rapidly growing with numerous Dapps available to users. However, this vast array often leaves users overwhelmed and uncertain about the security, reliability, and trustworthiness of these applications. Rate Caster addresses this challenge by leveraging the Ethereum Attestation Service (EAS), providing a platform where community feedback leads the way in determining the trustworthiness of Dapps and their decisions.

## Features

### Website

- **Home Page**: Displays a list of registered Dapps along with their community ratings. Users can search and filter through the list to find applications of interest.
- **Dapp Registration**: Allows users to register new Dapps on the platform, ensuring the database is continually updated with the latest applications.
- **Dapp Rating and Reviews**: Users can leave detailed reviews and rate Dapps, contributing to the overall trust score of each application.
- **My Reviews**: Users can view and manage their review history, with options to update or delete their past contributions.

### Integration with Warpcaster

- **Seamless Interaction**: Users can view popular Dapps and provide reviews within the Warpcaster chat frame.
- **Mapped Reviews**: Future plans include mapping user reviews to Farcaster IDs, enhancing the credibility of reviews by associating them with real user profiles.

## Quickstart

To get started with the Rate Caster application, follow the steps below:

1. **Clone this repository & install dependencies**

    ```bash
    git clone https://github.com/Rainbow1nTheDark/RateCaster.git
    cd RateCasterDapp
    yarn install
    ```

2. **Run a local network**

    In the first terminal, start a local Ethereum network using Hardhat:

    ```bash
    yarn chain
    ```

3. **Deploy the test contract**

    In a second terminal, deploy the test smart contract to the local network:

    ```bash
    yarn deploy
    ```

4. **Start the NextJS app**

    In a third terminal, start your NextJS app:

    ```bash
    yarn start
    ```

    Visit your app on: [http://localhost:3000](http://localhost:3000). You can interact with your smart contract using the `Debug Contracts` page.

## Future Directions

We believe in decentralized social applications and will be focusing on integrating and mapping Farcaster IDs to provided reviews. This will allow us to see Warpcaster profiles attached to the reviews, enhancing credibility and trust.

## Contribution and Community

Rate Caster is an open-source project, and community contributions are highly valued. Whether you're a developer, writer, or enthusiast, your input is welcome!

## Contact Us

For support or further inquiries, reach us at [@crypto_fencer](https://twitter.com/crypto_fencer) / [#0xbuilders](https://0xbuilders.org) or by email at [web3enthusiast@icloud.com](mailto:web3enthusiast@icloud.com).
