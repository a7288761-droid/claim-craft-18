# Claim Assistant Pro

Build a modern AI-powered web application called EasyClaim.

Project Goal

EasyClaim is an AI-powered platform that helps users understand their potential rights and prepare claim or appeal documents based on the insurance policies, contracts, receipts, tickets, and other documents they upload. The application assists users by analyzing their documents and generating draft claim letters. It does not guarantee compensation or provide binding legal advice.

Design

Create a premium, modern, responsive UI with a clean professional style.

Colors:

Blue

White

Light Gray

The interface should feel trustworthy, modern, and simple.

Authentication

Create:

Sign Up

Login

Forgot Password

User Profile

Logout

Dashboard

After login, show a dashboard containing cards for:

Health Insurance

Car Insurance

Travel Insurance

Airline Compensation

Shopping Refunds

Shipping Claims

Banking & Card Disputes

Telecom Complaints

Hotel Booking Issues

Product Warranty

Each card opens its own workspace.

Upload System

Allow users to upload:

Images

PDF documents

Show upload progress.

Preview uploaded files.

AI Analysis Page

After upload create a page with sections for:

Document Summary

Key Contract Clauses

Possible Reasons for Rejection

Important Dates

Important Financial Amounts

Suggested Next Steps

Use placeholder AI responses for now.

Claim Letter

Generate a professional appeal letter page with:

Copy button

Download button

Print button

Use placeholder content.

History

Create a history page showing previous analyses.

Notifications

Create a notification center.

Settings

Create settings page with:

Language

Theme (Light/Dark)

Account Settings

Delete Account

Future AI Integrations

Prepare the architecture for future integration with:

OpenAI API

OCR

PDF Parsing

Do not implement real APIs yet.
Only prepare clean service layers.

Database

Prepare database models for:

Users

Claims

Documents

Analysis Results

Generated Letters

Notifications

Requirements

Use clean architecture.

Use reusable components.

Responsive on desktop and mobile.

Professional animations.

Modern dashboard.

Professional loading states.

Error pages.

Empty states.

Beautiful icons.

Use best practices.

Generate a complete production-ready project structure that can be expanded later.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://claim-craft-18.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/546105e6-51f0-4e5d-bbbc-502e5808d6e7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
