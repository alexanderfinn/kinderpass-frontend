"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var http_1 = require("@angular/http");
var core_1 = require("@angular/core");
var Observable_1 = require("rxjs/Observable");
// declare var device: any;
// import 'app/js/device';
var Api = (function () {
    function Api(http) {
        this.http = http;
        var headers = new http_1.Headers({ 'Content-Type': 'application/json;charset=utf-8' });
        this.options = new http_1.RequestOptions({ headers: headers, withCredentials: true });
        if (window.location.hostName == 'kinderpass.ru')
            this.url = 'https://api.kinderpass.ru/';
        else
            this.url = 'https://test.kinderpass.ru/';
    }
    Api.prototype.getInfo = function () {
        return this.http.get(this.url + 'api/accounts/get_info', this.options)
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return Observable_1.Observable.throw(error); });
    };
    Api.prototype.updateInfo = function (data) {
        return this.http.post(this.url + 'api/accounts/update_contacts', data, this.options)
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return Observable_1.Observable.throw(error); });
    };
    Api.prototype.logout = function () {
        return this.http.get(this.url + 'api/accounts/logout', this.options)
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return Observable_1.Observable.throw(error); });
    };
    Api.prototype.getDistricts = function () {
        return this.http.get(this.url + 'api/geo/districts')
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return Observable_1.Observable.throw(error); });
    };
    Api.prototype.getMetro = function () {
        return this.http.get(this.url + 'api/geo/metro')
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return Observable_1.Observable.throw(error); });
    };
    Api.prototype.getCategories = function () {
        return this.http.get(this.url + 'api/activities/categories')
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return Observable_1.Observable.throw(error); });
    };
    Api.prototype.getSchedule = function (category_id, date, getParams) {
        var url = this.url + 'api/activities/list/' + category_id + '/' + date + '?';
        for (var key in getParams) {
            url += key + '=' + getParams[key] + '&';
        }
        return this.http.get(url)
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return Observable_1.Observable.throw(error); });
    };
    Api.prototype.initTransaction = function (type) {
        var tmp = '';
        if (!device.desktop()) {
            tmp = "?pageView=MOBILE";
        }
        var url = this.url + 'api/accounts/initiate_transaction/' + type + tmp;
        return this.http.post(url, '', this.options)
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return Observable_1.Observable.throw(error); });
    };
    Api.prototype.checkTransaction = function (transactionID) {
        var url = this.url + 'api/accounts/check_transaction/' + transactionID;
        return this.http.post(url, '', this.options)
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return Observable_1.Observable.throw(error); });
    };
    Api.prototype.makingBooking = function (timeSlotID, seats) {
        // In docs method = POST
        var url = this.url + 'api/activities/book/' + timeSlotID + '/' + seats;
        return this.http.get(url, this.options)
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return error; });
    };
    Api.prototype.cancelBooking = function (bookingID) {
        // In docs method = POST
        var url = this.url + 'api/activities/cancel_booking/' + bookingID;
        return this.http.get(url, this.options)
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return error; });
    };
    Api.prototype.registration = function (data) {
        console.log(data);
        var headers = new http_1.Headers({ 'Content-Type': 'application/json;charset=utf-8' });
        return this.http.post('https://script.google.com/macros/s/AKfycbzLz5xJS2x726J14D04DOYNyuuhIRrAqXlRlaJTf7sYSgoQcfE/exec', data, this.options)
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return Observable_1.Observable.throw(error); });
    };
    Api.prototype.getEventById = function (timeslot_id) {
        var url = this.url + 'api/activities/timeslot/' + timeslot_id;
        return this.http.get(url, this.options)
            .map(function (resp) { return resp.json(); })
            .catch(function (error) { return error; });
    };
    return Api;
}());
Api = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [http_1.Http])
], Api);
exports.Api = Api;
//# sourceMappingURL=api.service.js.map