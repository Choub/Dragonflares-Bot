import { DefaultField } from './DefaultField'

export class HydroField extends DefaultField{
	render(value){
		return `${new Intl.NumberFormat('en-US').format(value)}h`;
	}
}