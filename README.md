# MeetLife
MeetLife is a Discord bot that manages IRL Meetings between the members of your server, so that it can expand into the real world and enforce relationships.  
This bot is a submission for the **Discord Community Hack Week**.

## Features
- Natural language date processing
- Location research via OpenStreetMap Nominatim
- Search existing meetings via location, date, owner, name
- Support for joining meetings, with configurable limit
- Configurable reminder for members who joined a meeting, and notification for any modification
- Editable meetings after creation, by their owner or the moderation team
- Automatic database cleanup when a member leaves the server

## Installation
This bot requires [Node.js](https://nodejs.org/en/) (v10.15.0+) to be installed on your computer.
You simply need to clone this repo afterwards:
```
git clone https://github.com/Arc13/meetlife-bot.git
```
Once in the bot directory, create a file named `config.json`, and paste this inside:
```JSON
{
	"prefix": "!",
	"token": "your_token",
	"locale": "en-GB",
	"search_limit": 10
}
```
This is the config file, and you'll likely want to replace `your_token` with your bot token.
Finally, run this command to get the bot started:
```
npm run start
```

## Usage
The bot comes with an integrated help panel, just type this command in any channel the bot has access:
```
!help
```

## Acknowledgments
[Discord.js](https://github.com/discordjs/discord.js/) - The library used to interact with Discord   
[chrono-node](https://github.com/wanasit/chrono) - Parses natural date to prevent having the user to follow a format   
[request](https://github.com/request/request) - Simplifies the use of HTTP requests   
[OpenStreetMap Nominatim](https://wiki.openstreetmap.org/wiki/Nominatim) - Online API to search for places in the world   
[sequelize](https://github.com/sequelize/sequelize) - Used to store data in a local database 
