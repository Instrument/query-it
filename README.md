# Query It!
This repository houses the Query It! experience.

##Important
You need a valid [Google Cloud Platform project](http://cloud.google.com/free-trial/) to run this experience. Be aware, if you are not using a free trial, you will be charged for running the queries in this experience.

###Screenshots
![Query It! Intro Screen](https://raw.githubusercontent.com/Instrument/query-it/master/screenshots/start.png)
![Query It! Question Screen](https://raw.githubusercontent.com/Instrument/query-it/master/screenshots/question.png)
![Query It! Top 10 Answer Screen](https://raw.githubusercontent.com/Instrument/query-it/master/screenshots/resolve.png)
![Query It! Player Points Screen](https://raw.githubusercontent.com/Instrument/query-it/master/screenshots/final.png)

###Generate Cert Token
1. [Visit Credentials in GCP console](https://console.cloud.google.com/apis/credentials)
1. Click Manage Service Accounts
1. Create a new service account
1. Create a directory named `cert`
1. Download certificate and rename it `service_account.json`.
1. Put `service_account.json` in the `/cert` directory.

This project uses:
* [Webpack](https://github.com/webpack/webpack)
* [Sass](http://sass-lang.com/)

To run this locally you'll need to:
```
npm install
npm run dev
cd querysrv
node querysrv.js
```

## Vagrant

To use [Vagrant](https://www.vagrantup.com/) to run the stack:

1. `cd deploy`
1. `vagrant up`
1. `vagrant ssh`
1. `cd /vagrant/`
1. `npm run dev`

You may need to run Salt again to set everything up:

1. `vagrant up`
1. `vagrant ssh`
1. `sudo salt-call --local state.highstate`

##SocketTalk

To start the socket server, run `node server.js`.

After running this server, you need to start the clients for both Player 1 and Player 2 (see below).

When input is entered either locally or through a Pi, the data that is sent to the server is in JSON format.

```
{
	"running": "", // String for running answer, wiped down to an empty string when Enter is pressed
	"submitted": boolean, // true if Enter button was pressed, false otherwise
	"client": integer, // Should be either 1 or 2, depending on player identity
}
```

####Local

The inputs for Query It! are streamed through websockets.

Including an instance of `SocketDebugger` (currently in `app.js`), will allow you to enter input for either player. Simply typing will send input to Player 1, where holding shift and typing will send input to Player 2.

This functionality can also be tested with the `client.js` app by running using the following command in a seperate Terminal window.

```
node client.js --host=localhost --port=8095 --id=1
```

Using `--id=1` and `--id=2` will input the query into either Player 1 or Player 2's field. Using neither will give a pipeline for playing all sounds for the experience.

If you have two extra windows open, you can run a version of both `id`s and switch between them to closely approximate the game.

**Remember** that you have to type into the Terminal window, not the browser.

####Raspberry Pi

The Pis are currently configured to be on static IPs of `172.20.2.150` for Player 1 and `172.20.2.151` for Player 2. In order to update the computer that they automatically connect to on boot, you'll need to ssh in and change their boot address.

For example, if the computer running the experience has an address of `172.20.6.144`, follow these steps for the Player 1 Pi.

1. `ssh pi@172.20.2.150` (use Pi default password)
2. `sudo nano /home/pi/www/client.shl`
3. Edit line 3 to read `/usr/bin/node /home/pi/www/client.js --host=172.20.6.144 --port=8095 --id=1`
4. `sudo reboot`

Optionally, you can get the Pis to autostart the `client.js`:
1. `sudo nano ~/.config/lxsession/LXDE-pi/autostart`
2. Add `@lxterminal --command /home/pi/www/client.shl`


Follow these steps for Player 2 Pi, only use `ssh pi@172.20.2.151` and `--id=2`.



It's not working propely 
