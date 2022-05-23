#!/usr/bin/env node

// NOTE: The official inquirer documentation is really good. To know more about the different question types,
// please refer to https://www.npmjs.com/package/inquirer#prompt-types

const program = require('commander')
const inquirer = require('inquirer')
const { listEnis, updateEni } = require('./src')
require('colors')
const { version } = require('./package.json')
program.version(version) // This is required is you wish to support the --version option.

// 1. Creates your first command. This example shows an 'order' command with a required argument
// called 'product' and an optional argument called 'option'.
program
	.command('detach')
	.option('-i, --id', 'Filters by security group ID.')
	.option('-n, --name', 'Filters by security group name.')
	.description('Default behavior. Lists all the ENIs that are attached to a specific security group and gives the option to remove that security group attachement.') // Optional description
	.action(async (options, args) => {
		const { id, name } = options||{}
		let [value] = (args||{}).args||[]
		if (!id && !name) {
			console.log('Missing required argument --id or --name. Use `npx detach-aws-sg-from-eni --id <YOUR SG ID>` or `npx detach-aws-sg-from-eni --name <YOUR SG NAME>`'.red)
			process.exit()
		} 
		if (!value) {
			console.log('Missing required security group ID or name. Use `npx detach-aws-sg-from-eni --id <YOUR SG ID>` or `npx detach-aws-sg-from-eni --name <YOUR SG NAME>`'.red)
			process.exit()
		}
		value = value.trim()

		const enis = await listEnis(id ? { id:value } : { name:value })
		const filterGroup = id ? g => g.GroupId != value : g => g.GroupName != value
		if (!enis || !enis.length) {
			console.log('No ENIs found for this security group'.cyan)
			process.exit()
		} else {
			console.log(`Found ${enis.length} ENI${enis.length == 1 ? '' : 's'} attached to this security group`.cyan)
			let { values } = await inquirer.prompt([
				{ 
					type: 'checkbox', 
					name: 'values', 
					message: 'Select which ENIs should be detached from this security group: ',
					choices: [{
						name: 'All',
						value: 'all',
						checked: true
					}, ...enis.map(eni => ({ 
						name:`${eni.Description} (ID: ${eni.NetworkInterfaceId} - Region: ${eni.AvailabilityZone})`, 
						value:eni.NetworkInterfaceId 
					}))]
				}
			])

			if (values.some(v => v == 'all'))
				values = enis.map(eni => eni.NetworkInterfaceId)

			for (let i=0;i<values.length;i++) {
				const eniId = values[i]
				const eni = enis.find(e => e.NetworkInterfaceId == eniId)
				const updatedGroupIds = eni.Groups.filter(filterGroup).map(x => x.GroupId)
				await updateEni(eniId, updatedGroupIds)
			}
		}
	})

// 2. Deals with cases where no command is passed.
const cmdArgs = [process.argv[0], process.argv[1]]
if (process.argv.length == 2) {
	console.log('Missing required security group. Use `npx detach-aws-sg-from-eni --id <YOUR SG ID>` or `npx detach-aws-sg-from-eni --name <YOUR SG NAME>`'.red)
	process.exit()
} else if (process.argv.length > 2) {
	const thirdArg = (process.argv[2]||'').toLowerCase().trim()
	
	if (thirdArg == 'id' || thirdArg == '--id' || thirdArg == '-i')
		cmdArgs.push('detach', '--id', process.argv[3]||'')
	else if (thirdArg == 'name' || thirdArg == '--name' || thirdArg == '-n')
		cmdArgs.push('detach', '--name', process.argv[3]||'')
	else
		cmdArgs.push(process.argv[2], process.argv[3])
}


// 3. Starts the commander program
program.parse(cmdArgs) 





