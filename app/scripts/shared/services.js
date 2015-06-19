/**
 * Created by dell on 2015/6/8.
 * this is a global service
 */
(function(){

    "use strict";

    var services = angular.module("app.services",["cgNotify","app.config","ngResource"]);

    /**
     * Api server
     */
    services.service("ApiServer",
    ["globalConfig","$resource","$q",function(globalConfig,$resource,$q){

        this.getApiUrl = function(url){
            return globalConfig.apiUrl + url;
        };

        this.createResource = function(url,param_defaults,actions){

            var canceler = $q.defer();
            var inner_actions = {
                'query':  {method:'GET',timeout:canceler.promise},
                'create':  {method:'POST'},
                'update' : {method:'PUT'}
            };

            var user = JSON.parse(sessionStorage.getItem('USERTOKEN'));

            var inner_param_defaults = {user_token:function(){return user?user.user_token:null}};

            param_defaults = _.extend(inner_param_defaults,param_defaults);

            actions = $.extend(inner_actions,actions);
            return $resource(this.getApiUrl(url), param_defaults,actions);
        };

    }]);



    /**
     * notify
     */
    services.factory("Notify",["notify",function(notify){
        //include module Notify then use it
        return function (msg,state){
            notify({
                message:msg,
                classes: 'alert-'+state,
                templateUrl:"views/common/notify.html"
            });
        };
    }]);

    /**
     * error action
     */
    services.factory('errorInterceptor',['$q','Notify',function($q,Notify){
        return {
            'responseError': function(response) {

                if( response.status == 422 || response.status == 405 || response.status == 404 || response.status == 400){

                    Notify(response.data.message,'danger');

                }else if(response.status == 500){

                    Notify(response.data.message,'danger');

                }
                return $q.reject(response);
            }
        }
    }]);

    /**
     * 防止发送未定义的参数
     */
    services.factory('paramsFilter', [function () {
        return {
            request: function (config) {
                if(config.data){
                    _.each(config.data,function(val,name){
                        if($.trim(val).length == 0){
                            delete  config.data[name];
                        }
                    })
                }
                return config;
            }
        }
    }]);

    /**
     * 修正高度
     */
    services.factory('fixHeight', [function () {
        return function(){

            var heightWithoutNavbar = $("body > #wrapper").height() - 61;

            $(".sidebard-panel").css("min-height", heightWithoutNavbar + "px");

            var navbarHeigh = $('nav.navbar-default').height();
            var wrapperHeigh = $('#page-wrapper').height();

            var obj = document.getElementById("page-wrapper");


            if(navbarHeigh > wrapperHeigh){
                obj.style.minHeight = navbarHeigh + "px"
            }

            if(navbarHeigh < wrapperHeigh){
                obj.style.minHeight = $(window).height()  + "px";
            }
        }
    }]);

    /**
     * 公用分页
     */
    services.factory('globalPagination',[
    "$http","$q","ApiServer",
    function($http,$q,ApiServer){
        return{
            create:function(){
                return {
                    items_per_page:10,
                    total_items:0,
                    total_pages:0,
                    page:1,
                    max_size:5,
                    query_method:'query',
                    resource:null,
                    sort:"",
                    init:function(page){
                        this.page = page;
                        this.total_items = this.items_per_page * page;
                    },
                    select:function(page,condition,fields){
                        if(condition == null)
                            condition = {};
                        condition['page'] = this.page = page?page:1;
                        condition['per-page'] = this.items_per_page;
                        var _self = this;
                        if(this.sort)
                            condition.sort = this.sort;
                        return this.resource[_self.query_method](condition,function(data,headers){
                            var total_items = headers('X-Pagination-Total-Count');
                            var total_pages = Math.ceil(total_items / _self.items_per_page);

                            _self.total_items = total_items;
                            _self.total_pages = total_pages;
                        });
                    }
                }
            }
        }
    }]);



}).call(this);
