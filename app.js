// cPanel/Passenger loads this root startup file to launch the shared API and Angular server.
const { startServer } = require('./server/server');

startServer();
