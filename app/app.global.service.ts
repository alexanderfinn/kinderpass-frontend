import {Injectable, Inject} from '@angular/core';
import { Api } from './api.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Location } from '@angular/common'

import * as moment from 'moment';
declare var ga:Function;
declare var yaCounter44744683:any;

@Injectable()
export class GlobalService {
	isAuthenticated: boolean;
	innerpage: boolean;
	userInfo: any;
	popupName: string;
	msg:string;

	email: string;
	phone:string;
	policy: boolean;

	phoneMask:any;

	contactsForm: FormGroup;
	extendSubscription:boolean;
	newSubscription:boolean;

	url: any;
	booking_id: number;

	fragment: string;
	formValid: any;

	constructor(public httpService: Api, private fb: FormBuilder, @Inject(Window) private _window: Window, private _location: Location){
		this.userInfo = {};
		this.isAuthenticated = false;
		this.popupName = '';
		this.getUserInfo();
		this.innerpage = false;
		this.msg = '';
		this.email = '';
		this.phone = '';
		this.phoneMask = ['+', '7', '(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
		this.extendSubscription = false;
		this.newSubscription = false;
		this.policy = false;
		this.url = {};
		this.fragment = '';
		this.formValid = {
			'phone': true,
			'email': true
		};;
	}

	openPopup(name:string) {
		this.popupName = name;
		$("html").addClass('locked');
	}

	getUserInfo() : void {
		this.httpService.getInfo().subscribe((data:any) => {
			this.parseUserInfo(data);
		});
	}

	parseUserInfo(data:any):void {
		let th = this;
		if(data.status == 'ERROR') {
			this.isAuthenticated = false;
			this.userInfo = {};
		} else {
			if(localStorage.getItem('transaction.id'))
				this.httpService.checkTransaction(localStorage.getItem('transaction.id')).subscribe((data:any) => {
					if(data.status = "OK") {
						if (data.transaction.status == 'F') {
							if(localStorage.getItem('timeslot_id')) 
								this.msg = "Не удалось осуществить бронирование. Платеж отклонен. Попробуйте еще раз";
							else
								this.msg = "Платеж отклонен";

							this.openPopup('msgCancel');
							localStorage.removeItem('transaction.id');
							localStorage.removeItem('timeslot_id');
							localStorage.removeItem('seats');
						} else if (data.transaction.status == 'I') {
							this.msg = "Завершите процедуру оплаты";
							this.openPopup('msgCancel');
							localStorage.removeItem('transaction.id');
						} else if (data.transaction.status == 'C') {
							if(localStorage.getItem('timeslot_id')) {
								let timeslot : number = + localStorage.getItem('timeslot_id');
								let seats : any = JSON.parse(localStorage.getItem('seats'));

								this.httpService.makingBooking(timeslot, seats).subscribe((data:any) => {
									if (data.status == "OK") {
										this.booking_id = data.booking_id;

										this.getUserInfo();
										this.openPopup('booking');
									} else {
										if (data.reason == "TIME_SLOT_REGISTRATION_IS_OVER") {
											this.msg = "Завершено бронирование мест на выбранное мероприятие";
										} else {
											this.msg = "Что-то пошло не так. Попробуйте обновить страницу";
										}
										this.openPopup('msgCancel');
									}
									localStorage.removeItem('timeslot_id');
									localStorage.removeItem('seats');
								});
							} else {
								this.newSubscription = true;
							}
							localStorage.removeItem('transaction.id');
							this.getUserInfo();
						}
					} else {
						localStorage.removeItem('transaction.id');
					}
				});
			this.userInfo = data;
			this.isAuthenticated = true;
			this.email = this.userInfo.email;
			this.phone = this.userInfo.phone ? this.userInfo.phone.split("+7")[1] : '';
			this.policy = !!(this.userInfo.email && this.userInfo.phone);
			this.contactsForm = this.fb.group({
				'email': [this.email, [
							]
						],
				'phone': [this.phone, [
							]
						],
				'policy': [this.policy, [
							]
						]
			})


			if (!this.userInfo.phone || !this.userInfo.email) {
				this.popupName = 'updateInfo';
				ga('send', 'pageview', '/virtual/mailphoneopened');
				this.policy = false;
			} else if(this.userInfo.subscription) {
				var today : any = moment(new Date()).add(7,'days').format();
				var subscription : any = moment(new Date(this.userInfo.subscription.expires_at.replace(/(\d+).(\d+).(\d+)/,'$3-$2-$1'))).format();

				if ( moment(today).isAfter(subscription, 'day') )
					this.extendSubscription = true;
				else
					this.extendSubscription = false;
				this.policy = true;
			} else {
				this.popupName = "extendSubscription";
				this.extendSubscription = true;
				this.policy = true;
			}
			let th = this;
			window.onload = function() {

				if (yaCounter44744683) {
					console.log(th.userInfo.id);
					yaCounter44744683.userParams({UserId: th.userInfo.id, UserName: th.userInfo.name});
				}
				ga('set','userId',th.userInfo.id);
				ga('send', 'pageview', '/virtual/auth');
				if(th._window.location.hostname == 'kinderpass.ru')
					ga('send', 'event', 'Main', 'user_auth_'+th.userInfo.id, 'Prod');
				else if (th._window.location.hostname == 'front.kinderpass.ru')
					ga('send', 'event', 'Main', 'user_auth_'+th.userInfo.id, 'Test');

			}
		}
	}

	logout() : void {
		this.httpService.logout().subscribe((data:any) => {
			this.getUserInfo();
		});
	}

	update(form:any) : void {
		this.email = form.controls.email.value;
		this.phone = '+7'+ form.controls.phone.value.replace(/[^0-9]+/g, "");
		this.policy = form.controls.policy.value;
		let length = this.phone.length;
		let re = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/i;
		this.formValid = {
			'phone': length == 12,
			'email': re.test(this.email)
		};
		if (this.email && this.phone && this.policy && this.formValid.phone && this.formValid.email) {
			let body = {
				phone: this.phone, 
				email: this.email
			};
			this.httpService.updateInfo(JSON.stringify(body)).subscribe((data:any) => {
				if (data.phone && data.email) {
					this.popupName = '';
					$("html").removeClass('locked');
					this.userInfo.phone = this.phone;
					this.userInfo.email = this.email;
					this.policy = true;
					ga('send', 'pageview', '/virtual/mailphonesaved');
				}
			});

		}
	}

	initTransaction(type:string, amount:number) {
		this.httpService.initTransaction(type, amount).subscribe((data:any) => {
			if(data.status == 'OK') {
				localStorage.setItem('transaction.id', JSON.stringify(data.transaction.id));
				window.location.href = data.alfa.formUrl;
			}
		});
	}

	phoneValidation(input: any) {
		if (input.value){
			return input.value.replace(/[^0-9]+/g, "").length==10 ? null : { needsExclamation: true };
		}
	}

	openLoginPopup() {
		this.openPopup('login');
		ga('send', 'pageview', '/virtual/openauth');
		if(this._window.location.hostname == 'kinderpass.ru')
			ga('send', 'event', 'Main', 'OpenAuthPopup', 'Prod');
		else if (this._window.location.hostname == 'front.kinderpass.ru')
			ga('send', 'event', 'Main', 'OpenAuthPopup', 'Test');
	}

	declOfNum(number:number, titles:string[]) {  
		let cases = [2, 0, 1, 1, 1, 2];  
		return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];  
	}

	goBack() {
		this._location.back();
	}
}