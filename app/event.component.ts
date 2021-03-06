import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Api } from './api.service';
import { ActivatedRoute } from '@angular/router';
import { GlobalService } from './app.global.service';
import { PageScrollConfig, PageScrollService, PageScrollInstance } from 'ng2-page-scroll';
import {DOCUMENT} from '@angular/platform-browser';

import * as moment from 'moment';
require('slick-carousel');
declare var ga:Function;

@Component({
	selector: 'event',
	templateUrl: `../static/event.html?v=${new Date().getTime()}`,
	providers: [Api]
})

export class EventComponent implements OnInit, OnDestroy  { 
	
	timeslot_id:number;
	date:string;
	innerpage: boolean;
	event: any;
	seats:number;
	isActive:boolean;

	subscriptionDate: any;
	subscriptionPrice: number;

	discount : number;
	selectedLocation : number;
	selectedTime : number;
	selectedTicket : number;
	
	total: number;

	private sub: any;

	constructor(private httpService: Api, private route: ActivatedRoute, private gs: GlobalService, private pageScrollService: PageScrollService, @Inject(DOCUMENT) private document: any){
		this.innerpage = true;
		this.isActive = true;
		this.seats = 0;
		this.subscriptionPrice = 0;
		this.subscriptionDate = moment(new Date()).add(1, 'month').format();
		this.discount = 0;
		this.selectedLocation = 0;
		this.selectedTime = 0;
		this.selectedTicket = 0;
		this.total = 0;
	}

	ngOnInit(){
		this.sub = this.route.params.subscribe(params => {
			this.timeslot_id = +params['id'];
			this.date = params['date'];
			this.loadEvent();
			if(!this.gs.isAuthenticated){
				this.httpService.getInfo().subscribe((data:any) => {
					this.needSubscription();
				});
			}
		});
	}

	loadEvent() :void {
		this.httpService.getEventById(this.timeslot_id, this.date).subscribe((data:any) => {
			if(data.activity){
				for( var i in data.activity.locations) {
					for (var j in data.activity.locations[i].time_slots) {
						data.activity.locations[i].time_slots[j].tickets.sort(this.sortTicketsByPrice);
						var date = moment(data.activity.locations[i].time_slots[j].date.replace(/(\d+).(\d+).(\d+)/,'$3-$2-$1')).add(data.activity.locations[i].time_slots[j].start_time.split(':')[0], 'h').format();
						data.activity.locations[i].time_slots[j].date = date;
						for(var z in data.activity.locations[i].time_slots[j].tickets) {
							var d = data.activity.locations[i].time_slots[j].tickets[z];
							if (d.price_without_discount > 0) {
								var discount = d.price_without_discount - d.price;
								// var discount = (1-d.price/d.price_without_discount)*100;
								data.activity.locations[i].	time_slots[j].tickets[z].discount = discount;
							}
							data.activity.locations[i].time_slots[j].tickets[z].seats = 0;	

						}
					}
				}
				this.event = data.activity;
				this.needSubscription();

				this.isActive = this.checkTime();

				ga('send', 'pageview', '/virtual/eventopened');
				setTimeout(() => $('.eventPage-slider').slick({
						slidesToShow: 1,
						slidesToScroll: 1,
						arrows: true,
						dots: true,
						prevArrow: $('.sliderArrow__prev'),
						nextArrow: $('.sliderArrow__next'),
						autoplay: true,
						autoplaySpeed: 3000
					}), 0); 
				
			}
		});
	}

	sortTicketsByPrice(a:any, b:any) : number {
		return a.price - b.price;
	}

	addTicket(ticket: any) : void {
		if (ticket.seats < ticket.allocated_seats) {
			ticket.seats +=1;
			ga('send', 'pageview', '/virtual/eventaddticket');
			this.calcTotal();
		}
	}

	removeTicket(ticket: any) : void {
		if (ticket.seats >= 1) {
			ticket.seats -=1;
			this.calcTotal();
		}
	}

	needSubscription() : void {
		// if (this.gs.userInfo.subscription) {
		// 	if (this.event && this.event.locations) {
		// 		let eventDate : any = new Date(this.event.locations[0].time_slots[0].date.replace(/(\d+).(\d+).(\d+)/,'$3-$2-$1'));
		// 		let subscriptionExpires : any = new Date(this.gs.userInfo.subscription.expires_at.replace(/(\d+).(\d+).(\d+)/,'$3-$2-$1'));
		// 		if ((eventDate - subscriptionExpires) > 0) {
		// 			this.subscriptionPrice = 200;
		// 			this.subscriptionDate = moment(subscriptionExpires).add(1, 'month').format();
		// 		} else {
		// 			this.subscriptionPrice = 0;
		// 		}
		// 	}
		// } else {
		// 	this.subscriptionPrice = 200;
		// 	this.subscriptionDate = moment(new Date()).add(1, 'month').format();
		// }
	}

	calcTotal(): void {
		this.total = 0;
		this.discount = 0;
		for(var i in this.event.locations[this.selectedLocation].time_slots[this.selectedTime].tickets) {
			var d = this.event.locations[this.selectedLocation].time_slots[this.selectedTime].tickets[i];
			this.total += d.price * d.seats;	
			this.discount += d.discount * d.seats;	
		}
		this.isActive = this.checkTime();
	}

	getBookingInfo() {
		let tickets = this.event.locations[this.selectedLocation].time_slots[this.selectedTime].tickets;
		var data = {};
		for (let i in tickets) {
			if(tickets[i].seats > 0) {
				data[tickets[i].ticket_type_key] = tickets[i].seats;
			}
		}
		return data;
	}

	makingBooking() : void {

		if (!this.gs.isAuthenticated){
			let data = this.getBookingInfo();
			localStorage.setItem('ticketsPrice', JSON.stringify(this.total));
			localStorage.setItem('timeslot_id', this.event.locations[this.selectedLocation].time_slots[this.selectedTime].id);
			localStorage.setItem('seats', JSON.stringify(data));
			this.gs.openLoginPopup(this.date, this.timeslot_id);
		}
		else {
			ga('send', 'pageview', '/virtual/bookbtnclicked');
			let price = this.total + this.subscriptionPrice;
			let userBalance = 0;
			if (this.gs.userInfo.subscription) {
				userBalance += this.gs.userInfo.subscription.balance;
			}
			if ((price - userBalance) <= 0) {
				if(this.subscriptionPrice) {
					this.httpService.initTransaction('SM', this.subscriptionPrice).subscribe((data:any) => {
						if(data.status == 'OK') {
							this.httpService.checkTransaction(data.transaction.id).subscribe((data:any) => {
								if(data.status = "OK") {
									if (data.transaction.status == 'C') {
										let data = this.getBookingInfo();
										let id = this.event.locations[this.selectedLocation].time_slots[this.selectedTime].id;
										this.book(id,data);
									} else {
										this.gs.msg = "Что-то пошло не так. Попробуйте обновить страницу";
										this.gs.openPopup('msgCancel');
									}
								}
							})
						}
					});
				} else {
					let data = this.getBookingInfo();
					let id = this.event.locations[this.selectedLocation].time_slots[this.selectedTime].id;
					this.book(id,data);
				}
			} else {
				let data = this.getBookingInfo();
				localStorage.setItem('timeslot_id', JSON.stringify(this.event.locations[this.selectedLocation].time_slots[this.selectedTime].id));
				localStorage.setItem('seats', JSON.stringify(data));
				if(this.subscriptionPrice)
					this.gs.initTransaction('SB', (price - userBalance));
				else
					this.gs.initTransaction('B', (price - userBalance));
			}
		}
	}

	book(id:any, data:any) {
		this.isActive = this.checkTime();
		if (this.isActive) {
			this.gs.book(id, data);
		} else {
			this.gs.msg = "Выбранное мероприятие уже закончилось, бронирование невозможно";
			this.gs.openPopup('msgCancel');
		}
	}
	
	scrollToTicket() {
		let pageScrollInstance: PageScrollInstance = PageScrollInstance.newInstance({document: this.document, scrollTarget: "#ticket", pageScrollDuration: 100});
		this.pageScrollService.start(pageScrollInstance);
	}

	checkTime() : boolean {
		let eventDate = moment(this.event.locations[this.selectedLocation].time_slots[this.selectedTime].date).format('YYYY-MM-DD');
		let todayDate = moment().format('YYYY-MM-DD');
		if (moment(eventDate).isSame(todayDate, 'day')) {
			if (this.event.locations[this.selectedLocation].time_slots[this.selectedTime].end_time <= moment().format('HH:mm')) {
				return false;
			}
		} else if (moment(eventDate).isBefore(todayDate, 'day')) {
			return false;
		}
		return true;
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
		$('.eventPage-slider').slick('unslick');
	}

}	
