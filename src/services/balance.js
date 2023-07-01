const { sequelize, ProfileTypes, ContractStatuses } = require('../model')
const { Op } = require("sequelize");

/**
 * Makes a deposit towards specified account
 * @param {*} req 
 * @param {*} res 
 * @returns successful message or error
 */
const makeDeposit = async (req, res) =>{
  const { Job, Contract, Profile } = req.app.get('models')
  const { userId } = req.params
  const { deposit } = req.body
fix(balance): updating transaction usage
  if(!deposit) return res.status(403).json({ message: 'Error: A deposit value is required' }).end()

  const t = await sequelize.transaction();
  try {
      const profile = await Profile.findOne({
          where: {
              id: userId,
             type: ProfileTypes.CLIENT
          },
          include: [{
              model: Contract,
              as: 'Client',
              where: {
                status: {
                  [Op.or]: [ContractStatuses.NEW, ContractStatuses.INPROGRESS]
                },
              },
              include: [{            
                  model: Job,
                  where: {
                    paid: null,
                  }
              }]
          }],
      }, transaction: t)
    
      if(!profile?.Client || profile?.Client.length === 0) return res.status(404).json({ message: 'Error: Job or contract not found' }).end()
      const totalPerJobsFunc = (initialValue, job) => initialValue + job.price
      const totalPerContractFunc = (initialClientValue, client) => initialClientValue + client.Jobs.reduce(totalPerJobsFunc, 0)
      const clientTotalJobs = profile.Client.reduce(totalPerContractFunc, 0)
      const MAXDEPOSIT = (clientTotalJobs*25)/100

      if(deposit > MAXDEPOSIT) return res.status(403).json({ message: `Error: Max deposit permited: ${MAXDEPOSIT}` }).end()

  
      await profile.increment('balance', { by: deposit, where: { id: userId }, transaction: t})
      await t.commit();
  } catch (error) {
      console.log(error)
      await t.rollback();
      return res.status(503).end()
  }

  res.json({message: 'deposit concluded', currentBalance: profile.balance + deposit})
}

module.exports = { makeDeposit }
