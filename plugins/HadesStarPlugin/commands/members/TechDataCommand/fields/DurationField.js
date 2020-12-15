import { DefaultField } from './DefaultField'

export class DurationField extends DefaultField{
	render(value){
		value = Number(value);
		const d = Math.floor(value / (3600*24));
		const h = Math.floor(value % (3600*24) / 3600);
		const m = Math.floor(value % 3600 / 60);
		const s = Math.floor(value % 60);

		return [
			d > 0 ? d + (d == 1 ? " day" : " days") : "",
			h > 0 ? h + (h == 1 ? " hour" : " hours") : "",
			m > 0 ? m + (m == 1 ? " minute" : " minutes") : "",
			s > 0 ? s + (s == 1 ? " second" : " seconds") : ""
		].join(" ")
	}
}