const { sequelize } = require('../model')
const { QueryTypes } = require("sequelize");
const { ProfileTypes } = require('../model')

/**
 * Get the best professions by highest paying
 * @param {*} req 
 * @param {*} res 
 * @returns A profession with a value or an error
 */
const getBestProfessions = async (req, res) =>{
  // TODO: discuss how there should be a new user type called admin
  const { start, end } = req.query
  if(!start || !end) return res.status(400).json({ message: 'Error: start and end dates are required.' }).end()

  const result = await sequelize.query(`
    SELECT Sum(Jobs.price) AS total_earned, Profiles.profession
        FROM Jobs
    INNER JOIN Contracts
        ON Jobs.ContractId = Contracts.id
    INNER JOIN Profiles
        ON Contracts.ContractorId = Profiles.id
    WHERE Profiles.type = :profileType AND Jobs.paid = 1 AND Jobs.paymentDate BETWEEN :start AND :end
    GROUP BY Profiles.profession
    ORDER BY total_earned DESC
    LIMIT 1    
  `, { type: QueryTypes.SELECT, replacements: { start, end, profileType: ProfileTypes.CONTRACTOR } });
  
  if(!result || result.length === 0) return res.status(404).end()
  res.json(result[0])
}

/**
 * Get best clients by highest spenders
 * @param {*} req 
 * @param {*} res 
 * @returns id, name and value spent or an error
 */
const getBestClients = async (req, res) =>{
  // TODO: discuss how there should be a new user type called admin
  const {start, end, limit = 2} = req.query
  if(!start || !end) return res.status(400).json({ message: 'Error: start and end dates are required.' }).end()

  const result = await sequelize.query(`
    SELECT Profiles.id, Profiles.firstName  || ' ' ||  Profiles.lastName AS fullName, Sum(Jobs.price) AS paid
        FROM Jobs
    INNER JOIN Contracts
        ON Jobs.ContractId = Contracts.id
    INNER JOIN Profiles
        ON Contracts.ClientId = Profiles.id
    WHERE Profiles.type = :profileType AND Jobs.paid = 1 AND Jobs.paymentDate BETWEEN :start AND :end
    GROUP BY Profiles.id
    ORDER BY paid DESC
    LIMIT :limit
  `, { type: QueryTypes.SELECT, replacements: { start, end, limit, profileType: ProfileTypes.CLIENT } });
  
  if(!result || result.length === 0) return res.status(404).end()
  res.json(result)
}

module.exports = { getBestProfessions, getBestClients }