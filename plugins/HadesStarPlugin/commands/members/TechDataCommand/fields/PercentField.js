import { DefaultField } from './DefaultField'

export class PercentField extends DefaultField{
	render(value){
		return `${new Intl.NumberFormat('en-US').format(value)}%`;
	}
}