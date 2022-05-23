require('colors')
const { exec } = require('child_process')

const _void = x => x

const _exec = cmd => new Promise(next => {
	exec(cmd, (error, stdout, stderr) => {
		if (error || stderr)
			next([(error||{}).message || stderr, null])
		else
			next([null, stdout])
	})
})

const _stringToJson = str => {
	try {
		if (!str)
			return {}
		else if (typeof(str) == 'object')
			return str
		else
			return JSON.parse(str)
	} catch(err) {
		_void(err)
		console.log('Failed to parse string to JSON. String details:'.red)
		console.log(`${str||''}`.red)
		process.exit()
	}
}

/**
 * Lists all the ENIs attached with a specific security group. 
 * Use either 'id' or 'name' to identify the SG.
 * 
 * @param  {String} id		e.g., 'sg-04749f5c743ca2c8c'
 * @param  {String} name	e.g., 'my-sg'
 * 
 * @return {[ENI]}	
 */
const listEnis = async ({ id, name }) => {
	const key = id ? 'group-id' : 'group-name'
	const value = id||name
	const [error, results] = await _exec(`aws ec2 describe-network-interfaces --filters Name=${key},Values=${value}`)
	if (error) {
		console.log(`Failed to list ENIs attached to security group '${value}'. Details:`.red)
		console.log(`${error}`.red)
		process.exit()
	}

	return _stringToJson(results).NetworkInterfaces||[]
}

/**
 * Update the security group IDs on an ENI.
 * 
 * @param  {String}		eniId		e.g., 'eni-0ef6b2412fea64003'
 * @param  {[String]}	groupIds	e.g., ['sg-04749f5c743ca2c8c']
 * 
 * @return {Void}
 */
const updateEni = async (eniId, groupIds) => {
	if (!eniId) {
		console.log('Failed to execute `aws ec2 modify-network-interface-attribute`. Missing required --network-interface-id argument.'.red)
		process.exit()
	}
	if (!groupIds || !groupIds.length) {
		console.log(`${'WARNING'.bold}: Skipping the update of ENI ${eniId}. Setting that ENI with no security group IDs is not supported. At least one security group ID must be set.`.yellow)
		return
	}
	const [error] = await _exec(`aws ec2 modify-network-interface-attribute --network-interface-id ${eniId} --groups ${groupIds.join(' ')}`)
	if (error) {
		console.log(`Failed to update ENI ${eniId}. Details:`.red)
		console.log(`${error}`.red)
		process.exit()
	}

	console.log(`ENI ${eniId} successfully updated`.green)
}

module.exports = {
	listEnis,
	updateEni
}