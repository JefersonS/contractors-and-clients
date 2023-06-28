const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')

const { getContractById, getContracts } = require('./services/contracts')
const { getUnpaidJobs, payJob } = require('./services/jobs')
const { makeDeposit } = require('./services/balance')
const { getBestClients, getBestProfessions } = require('./services/admin')

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

// Contract routes
app.get('/contracts/:id', getProfile, getContractById)
app.get('/contracts', getProfile, getContracts)

// Job routes
app.get('/jobs/unpaid', getProfile, getUnpaidJobs)
app.post('/jobs/:id/pay', getProfile, payJob)

// Balance routes
app.post('/balances/deposit/:userId', getProfile, makeDeposit)

// Admin routes
app.get('/admin/best-profession', getProfile, getBestProfessions)
app.get('/admin/best-clients', getProfile, getBestClients)

module.exports = app;
