# Car Rental App

A simple car rental mobile application built in React Native (Expo). Users can
view a list of available cars, view the details of each car, and place a
booking.

The project starts with dummy data embedded in the app, and will later add a
simple backend to fetch data from.

## Tech Stack

- [Expo](https://expo.dev) (SDK 57) + TypeScript
- [React Navigation](https://reactnavigation.org) (native-stack)
- React Context API for global state

## Project Structure

```
src/
  navigation/   # Stack navigator and route param types
  screens/      # App screens (CarList, CarDetails, Booking)
  context/      # Global state providers (React Context API)
```

## Getting Started

Install dependencies:

```
npm install
```

Start the dev server:

```
npm start
```

Then either:

- Press `w` to open the app in a web browser
- Scan the QR code with the [Expo Go](https://expo.dev/go) app on your phone
  (same Wi-Fi network, requires an Expo account login)

## Status

Repo scaffold only: navigation skeleton with placeholder screens, no feature
logic or dummy data implemented yet.
