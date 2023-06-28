const { Op } = require("sequelize");
const { ContractStatuses } = require('../model')

/**
 * Get contracts by ID where the logged in profile is either client or contractor
 * @param {*} req 
 * @param {*} res 
 * @returns a contract or error
 */
const getContractById =  async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id: profileId } = req.profile
  const { id } = req.params

  const contract = await Contract.findOne({
    where: {
      id,
      [Op.or]: [
        {ContractorId: profileId},
        {ClientId: profileId}
      ],
    }
  })

  if(!contract) return res.status(404).json({ message: 'Error: Contract not found' }).end()
  res.json(contract)
}

/**
 * Get all contracts non terminates where logged in profile is either client or contractor
 * @param {*} req 
 * @param {*} res 
 * @returns list of contracts or error
 */
const getContracts = async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id: profileId } = req.profile
  const contracts = await Contract.findAll({
    where: {
      [Op.or]: [
        {ContractorId: profileId},
        {ClientId: profileId}
      ], 
      status: {
        [Op.or]: [ContractStatuses.NEW, ContractStatuses.INPROGRESS]
      }
    }
  })

  if(!contracts || contracts.length === 0) return res.status(404).json({ message: 'Error: Contracts not found' }).end()
  res.json(contracts)
}

module.exports = { getContractById, getContracts}