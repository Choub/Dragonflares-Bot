import { DefaultField } from './DefaultField'

export class RSWSBSPercentField extends DefaultField{
	render(value){
		const [rs, ws, bs] = value.split('!')
		return [
			`RS: ${rs}%`,
			`WS: ${ws}%`,
			`BS: ${bs}%`
		].join('\n');
	}
}