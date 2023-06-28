const { Op } = require("sequelize");
const { sequelize, ContractStatuses } = require('../model')

const DEFAULT_PAID_VALUE = true

/**
 * Get unpaid jobs for the logged in client
 * @param {*} req 
 * @param {*} res 
 * @returns list of jobs or error
 */
const getUnpaidJobs = async (req, res) => {
  const { Job, Contract } = req.app.get('models')
  const { id: profileId } = req.profile
  const jobs = await Job.findAll({
    where: {
      paid: null,
    },
    include: [{
      model:Contract,
      where: {
        status: {
          [Op.or]: [ContractStatuses.NEW, ContractStatuses.INPROGRESS]
        },
        [Op.or]: [
          { ContractorId: profileId },
          { ClientId: profileId }
        ]
      }
    }]
  })
  
  if(!jobs || jobs.length === 0) return res.status(404).json({ message: 'Error: No upaid jobs found' }).end()
  res.json(jobs)
}

/**
 * Pays a job if the found balance is enough
 * @param {*} req 
 * @param {*} res 
 * @returns sucessful message and balance or error
 */
const payJob = async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models')
  const { id: profileId } = req.profile
  const { id } = req.params
  
  const job = await Job.findOne({
    where: { id },
    include: [{
      model:Contract,
      where: {
        ClientId: profileId,
      }
    }]
  })
  
  if(!job) return res.status(404).json({ message: 'Job not found' }).end()
  
  const profile = await Profile.findOne({ where:{ id: profileId } })
  if(profile.balance < job.price) return res.status(403).json({ message: 'Error: Enough balance in the account was not found' }).end()

  // TODO: discuss if Contract should be moved to terminated or not, since terminated sounds like a contract ceased and not finished
  const t = await sequelize.transaction();
  try {
      await profile.update({ balance: profile.balance - job.price }, { transaction: t })
      await Profile.increment('balance', { by: job.price, where: { id: job.Contract.ContractorId }, transaction: t})
      await job.update({ paid: DEFAULT_PAID_VALUE, paymentDate: new Date() }, { transaction: t })
      await Contract.update({ status: ContractStatuses.TERMINATED}, { where: { id: job.Contract.id }, transaction: t })
      await t.commit();
  } catch (error) {
      console.log(error)
      await t.rollback();
      return res.status(503).json({ message: 'Error: It was not possible to conclude the transaction' }).end()
  }

  res.json({message: 'contract paid', currentBalance: profile.balance})
}

module.exports = { getUnpaidJobs, payJob }