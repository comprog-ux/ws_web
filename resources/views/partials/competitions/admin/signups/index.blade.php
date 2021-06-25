<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-default">
                <div class="panel-heading">
                    <div class="row">
                        <div class="col-xs-9">{{_('Anmälningar')}}</div>
                        <div class="col-xs-3 text-right"><% signups.signups.data.length %> av <% signups.signups.total %></div>
                    </div>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-3">
                            <button class="btn btn-primary" ng-click="signups.openUserSearchModal();">{{_('Sök eller lägg till användare')}}</button>
                        </div>
                        <div class="col-sm-3">
                            <select class="form-control" ng-model="signups.signups.status" ng-change="signups.updatePage();">
                                <option value="">{{_('Status')}}</option>
                                <option value="approval">{{_('Efteranmälningar att godkänna')}}</option>
                                <option value="approved">{{_('Godkända efteranmälningar')}}</option>
                            </select>
                        </div>
                        <div class="col-sm-3">
                            <select class="form-control" ng-model="signups.signups.invoice" ng-change="signups.updatePage();">
                                <option value="">{{_('Välj status för betalning')}}</option>
                                <option value="open">{{_('Utan faktura')}}</option>
                                <option value="unpaid">{{_('Ej betalda')}}</option>
                                <option value="paid">{{_('Betalda')}}</option>
                            </select>
                        </div>
                        <div class="col-sm-3">
                            <div class="input-group">
                                <input type="text" ng-model="signups.signups.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search" ng-model-options='{debounce: 500}' ng-change="signups.updatePage();">
                                <span class="input-group-addon"><i class="fa fa-search"></i></span>
                            </div>
                        </div>
                    </div>
                </div>
                <table class="table table-bordered table-striped ">
                    <thead>
                    <tr>
                        <th>{{_('Datum')}}</th>
                        <th>{{_('Tävling')}}</th>
                        <th>{{_('Användare')}}</th>
                        <th>{{_('Förening')}}</th>
                        <th>{{_('Faktura')}}</th>
                        <th>{{_('Önskemål')}}</th>
                        <th>{{_('Kommentar')}}</th>
                        <th class="text-right">{{_('Vapengrupp')}}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr ng-repeat="signup in signups.signups.data">
                        <td><% signup.competition.date %></td>
                        <td><% signup.competition.name %></td>
                        <td><a ui-sref="competitions.admin.users.show({user_id: signup.user.user_id})"><% signup.user.fullname %> <span ng-if="signup.user.shooting_card_number">(<% signup.user.shooting_card_number %>)</span></a></td>
                        <td><% signup.club.name %></td>
                        <td>
                            <div class="btn-group" ng-if="signup.invoice">
                                <button type="button"
                                        class="btn btn-xs btn-default dropdown-toggle"
                                        data-toggle="dropdown"
                                        aria-haspopup="true"
                                        aria-expanded="false">
                                    <i class="fa fa-check-square text-primary" ng-if="signup.invoice.paid_at"></i> <% signup.invoice.invoice_reference %> <span class="caret"></span>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a href="#" ng-click="signups.openPaymentModal(signup.invoice)">{{_('Markera betalning')}}</a></li>
                                    <li><a ui-sref="competitions.admin.invoices.show({id: signup.invoice.id})">{{_('Visa fakturan')}}</a></li>
                                </ul>
                            </div>
                            <div class="btn-group" ng-if="!signup.invoice && (!signup.requires_approval || signup.is_approved_by != 0)">
                                <button type="button"
                                        class="btn btn-xs btn-warning dropdown-toggle"
                                        data-toggle="dropdown"
                                        aria-haspopup="true"
                                        aria-expanded="false">
                                    {{_('Skapa faktura')}} <span class="caret"></span>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a href="#" ng-click="signups.createInvoice(signup)">{{_('Skapa faktura nu')}}</a></li>
                                    <li><a href="#" ng-click="signups.createInvoice(signup, 'paid')">{{_('Skapa faktura och markera som betald')}}</a></li>
                                </ul>
                            </div>
                                <button type="button"
                                        ng-if="signup.requires_approval && !signup.is_approved_by"
                                        ng-click="signups.approveSignup(signup)"
                                        class="btn btn-xs btn-warning dropdown-toggle"
                                        >
                                    {{_('Godkänn efteranmälan')}}
                                </button>
                            </div>
                        </td>
                        <td>
                            <span uib-tooltip-html="signup.special_wishes | renderHTMLCorrectly" class="label label-primary" ng-if="signup.special_wishes">{{_('Önskemål')}}</span>
                            <span ng-if="!signup.special_wishes">-</span>
                        </td>
                        <td>
                            <span uib-tooltip-html="signup.note | renderHTMLCorrectly" class="label label-primary" ng-if="signup.note">{{_('Kommentar')}}</span>
                            <span ng-if="!signup.note">-</span>
                        </td>
                        <td class="text-right">
                            <span class="label label-default margin-right-5"><% (signup.competition.championships_id) ? signup.weaponclass.classname_general : signup.weaponclass.classname %></span>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <div class="panel-footer">
                    <div class="row">
                        <div class="col-lg-10 col-md-8 col-sm-8 col-xs-6">
                            <div uib-pagination
                                    total-items="signups.signups.total"
                                    ng-model="signups.signups.current_page"
                                    items-per-page="signups.signups.per_page"
                                    max-size="5"
                                    ng-change="signups.updatePage()"
                                    class="margin-0"
                                    boundary-links="true"
                                    rotate="false"
                                    first-text="{{_('Första')}}"
                                    last-text="{{_('Sista')}}"
                                    next-text="{{_('&raquo;')}}"
                                    previous-text="{{_('&laquo;')}}"
                            ></div>
                        </div>
                        <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                            <select ng-model="signups.signups.per_page" ng-options="n for n in [5,10,25,50,100]" class="form-control text-right" ng-change="signups.updatePage();">
                            </select>
                        </div>
                        <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                            <input type="number" min="1" ng-model="signups.signups.current_page" class="form-control text-right" ng-model-options='{debounce: 500}' ng-change="signups.updatePage();">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script type="text/ng-template" id="userSearchModal.html">
        <div class="modal-header">
            <h3 class="modal-title">{{_('Sök efter befintlig användare')}}</h3>
        </div>
        <div class="modal-body" ng-hide="usersearch.create_user">
            <div class="input-group">
                <input type="text" ng-model="usersearch.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search" ng-model-options='{debounce: 500}' ng-change="usersearch.searchForUser();">
                <span class="input-group-addon"><i class="fa fa-search"></i></span>
           </div>

 
           <table class="table table-striped table-condesed table-hover margin-top-10" ng-show="usersearch.users.data.length">
                <tbody>
                    <tr ng-repeat="user in usersearch.users.data">
                        <td><% user.fullname %></td>
                        <td><% user.clubs[0].name %></td>
                        <td class="text-right"><button class="btn btn-primary btn-xs" ng-click="usersearch.selectUser(user.user_id)">{{_('Visa användare')}}</button></td>
                    </tr>
                </tbody>
            </table>
            <h4 ng-show="usersearch.users.data.length">{{sprintf('Visar %s av totalt %s hittade personer', '<% usersearch.users.to %>', '<% usersearch.users.total %>')}}</h4>

            <div class="row">
                <div class="col-md-8 col-md-offset-2">
                    <div class="well well-sm margin-top-20 text-center" ng-show="usersearch.users">
                        <h3 class="margin-top-0">{{_('Saknas personen du söker?')}}</h3>
                        <p>{{_('Om personen saknas har du möjlighet att registrera personen som en ny användare')}}.</p>
                        <button class="btn btn-primary btn-sm" ng-click="usersearch.create_user = true">{{_('Registrera ny användare')}}</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="modal-body" ng-show="usersearch.create_user">

            <div class="row">
                <div class="col-sm-5 padding-top-5">{{_('Förening')}}</div>
                <div class="col-sm-7">
                    <input type="text"
                           class="form-control"
                           ng-model="usersearch.searchQuery"
                           placeholder="{{_('Sök efter din förening...')}}"
                           ng-model-options="{debounce: 300}"
                           uib-typeahead="searchclub for searchclubs in usersearch.searchForClubs($viewValue, usersearch.club);"
                           typeahead-loading="loadingClubs"
                           typeahead-no-results="usersearch.noMatchingClubs"
                           typeahead-template-url="customTemplate.html"
                           typeahead-on-select="usersearch.selectClub($item);">
                    <div class="text-muted padding-top-5">
                        <div class="row hide" ng-class="{'show': usersearch.loadingClubs}">
                            <div class="col-sm-12">
                                <p>
                                    {{_('Söker efter en förening')}}...
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="row hide" ng-class="{'show': usersearch.noMatchingClubs && usersearch.searchQuery}">
                        <div class="col-sm-12">
                            <strong>{{_('Ovanstående förening finns ej och kommer att skapas!')}}</strong>
                            <p class="text-danger">{{_('Var noga med att stava rätt och koppla användaren till rätt förening då personen endast kan byta förening genom att ta kontakt med oss.')}}</p>
                        </div>
                    </div>

                    <div class="row hide" ng-class="{'show': !usersearch.noMatchingClubs && usersearch.new_club}">
                        <div class="col-sm-12">
                            <span class="text-muted">{{_('Användaren kommer att kopplas till följande förening:')}}</span><br>
                            <strong>"<% usersearch.new_club.name %>"</strong>
                            <p class="text-danger"><small>{{_('Var noga med att koppla användaren till rätt förening då personen endast kan byta förening genom att ta kontakt med oss.')}}</small></p>
                        </div>
                    </div>
                </div>
            </div>

            <hr>
            <div class="row">
                <div class="col-sm-5 padding-top-5">{{_('Förnamn')}}</div>
                <div class="col-sm-7">
                    <input type="text" class="form-control" ng-model="usersearch.newUser.name" ng-enter="user.saveUserprofile()" placeholder="{{_('Förnamn')}}">
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-5 padding-top-5">{{_('Efternamn')}}</div>
                <div class="col-sm-7">
                    <input type="text" class="form-control" ng-model="usersearch.newUser.lastname" ng-enter="user.saveUserprofile()" placeholder="{{_('Efternamn')}}">
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-5 padding-top-5">{{_('E-postadress')}}</div>
                <div class="col-sm-7">
                    <input type="text" class="form-control" ng-model="usersearch.newUser.email" ng-enter="user.saveUserprofile()" placeholder="{{_('E-postadress')}}">
                    <div class="margin-top-10" ng-if="!usersearch.newUser.email">
                        <label for="no_email_address" ng-if="!usersearch.newUser.no_email_address">
                            <input type="checkbox" ng-model="usersearch.newUser.set_no_email_address" id="no_email_address" ng-true-value="1", ng-false-value=""> {{_('Användaren saknar e-postadress')}}
                        </label>
                        <span ng-if="usersearch.newUser.no_email_address">{{_('Användaren har registrerats utan e-postadress')}}: <% usersearch.newUser.no_email_address | dateToISO | date : 'yyyy-MM-dd' %></span>
                    </div>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-5 padding-top-5">{{_('Pistolskyttekortsnummer')}}</div>
                <div class="col-sm-7">
                    <input type="text" class="form-control" ng-model="usersearch.newUser.shooting_card_number" ng-enter="user.saveUserprofile()" placeholder="{{_('Pistolskyttekortsnummer')}}">
                    <div class="margin-top-10" ng-if="!usersearch.newUser.shooting_card_number">
                        <label for="no_shooting_card_number" ng-if="!usersearch.newUser.no_shooting_card_number">
                            <input type="checkbox" ng-model="usersearch.newUser.set_no_shooting_card_number" id="no_shooting_card_number" ng-true-value="1", ng-false-value=""> {{_('Användaren har inte fått sitt pistolskyttekortsnummer ännu')}}
                        </label>
                        <span ng-if="usersearch.newUser.no_shooting_card_number">{{_('Användaren har registrerats utan pistolskyttekortsnummer')}} <% usersearch.newUser.no_shooting_card_number | dateToISO | date : 'yyyy-MM-dd' %></span>
                    </div>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-12 text-right">
                    <button class="btn btn-primary" ng-click="usersearch.createuser()">{{_('Skapa användaren')}}</button>
                </div>
            </div>

        </div>

        <div class="row hidden-print">
            <div class="col-sm-2 col-sm-offset-5 text-center text-muted" ng-show="usersearch.loadingState">
                <div class='uil-default-css'>
                    <div style='top:60px;left:96px;width:8px;height:80px;background:#00ABAA;-webkit-transform:rotate(0deg) translate(0,-60px);transform:rotate(0deg) translate(0,-60px);border-radius:0px;position:absolute;'></div>
                    <div style='top:60px;left:96px;width:8px;height:80px;background:#00ABAA;-webkit-transform:rotate(90deg) translate(0,-60px);transform:rotate(90deg) translate(0,-60px);border-radius:0px;position:absolute;'></div>
                    <div style='top:60px;left:96px;width:8px;height:80px;background:#00ABAA;-webkit-transform:rotate(180deg) translate(0,-60px);transform:rotate(180deg) translate(0,-60px);border-radius:0px;position:absolute;'></div>
                    <div style='top:60px;left:96px;width:8px;height:80px;background:#00ABAA;-webkit-transform:rotate(270deg) translate(0,-60px);transform:rotate(270deg) translate(0,-60px);border-radius:0px;position:absolute;'></div>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <div class="row">
                <div class="col-sm-6 text-left"><button class="btn btn-default" type="button" ng-click="usersearch.closeModal()">{{_('Stäng')}}</button></div>
            </div>
        </div>
    </script>

    <script type="text/ng-template" id="customTemplate.html">
        <a ng-class="{'line-through disabled': match.model.alreadySelected == true}">
            <% match.model.clubs_nr %> <% match.model.name %>
        </a>
    </script>

    <script type="text/ng-template" id="ClubInvoicePaymentModal.html">
        <div class="modal-header">
            <h3 class="modal-title">{{_('Registrera betalning')}}</h3>
        </div>

        <div class="modal-body">

            <div class="row">
                <div class="col-sm-6">
                    <label>{{_('Fakturnr')}}</label><br>
                </div>
                <div class="col-sm-6 text-right">
                    <% modalcontroller.invoice.invoice_reference %>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <label>{{_('Datum')}}</label><br>
                </div>
                <div class="col-sm-6 text-right">
                    <% modalcontroller.invoice.invoice_date %>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <label>{{_('Summa')}}</label><br>
                </div>
                <div class="col-sm-6 text-right">
                    <% modalcontroller.invoice.amount %>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <label>{{_('Status')}}</label><br>
                </div>
                <div class="col-sm-6 text-right">
                    <% modalcontroller.invoice.payment_status %>
                </div>
            </div>

            <hr>
            <div class="row">
                <div class="col-sm-12">
                    <label>{{_('Betaldatum')}}</label>
                    <div uib-datepicker ng-model="modalcontroller.invoice.paid_at" class="well well-sm" datepicker-options="modalcontroller.options"></div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <div class="row">
                <div class="col-sm-6 text-left">
                    <button class="btn btn-default" type="button" ng-click="modalcontroller.cancel()">Cancel</button>
                </div>
                <div class="col-sm-6 text-right">
                    <button class="btn btn-primary" type="button" ng-click="modalcontroller.registerPayment(modalcontroller.invoice)">{{_('Registrera betalning')}}</button>
                </div>
            </div>
        </div>
    </script>

</ui-view>