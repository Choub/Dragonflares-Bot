import { DefaultField } from './DefaultField'

export class CreditField extends DefaultField{
	render(value){
		return `${new Intl.NumberFormat('en-US').format(value)}c`;
	}
}