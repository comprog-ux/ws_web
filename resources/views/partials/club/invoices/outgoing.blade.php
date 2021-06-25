<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">
                {{_('Skickade Fakturor')}}
            </div>
            <div class="col-sm-6 text-right">
                {{_('Visar')}} <% invoices.invoices.data.length %> {{_('av')}} <% invoices.invoices.total %>
            </div>
        </div>
    </div>
    <div class="panel-body">
        <div class="row">
            <div class="col-sm-6">
                <div class="btn-group">
                    <label class="btn btn-success" ng-model="invoices.invoices.payment_status" ng-click="invoices.updatePage()" uib-btn-radio="'all'" uib-uncheckable="uncheckable">{{_('Alla')}}</label>
                    <label class="btn btn-success" ng-model="invoices.invoices.payment_status" ng-click="invoices.updatePage()" uib-btn-radio="'unpaid'" uib-uncheckable="uncheckable">{{_('Obetalda')}}</label>
                    <label class="btn btn-success" ng-model="invoices.invoices.payment_status" ng-click="invoices.updatePage()" uib-btn-radio="'paid'" uib-uncheckable="uncheckable">{{_('Betalda')}}</label>
                </div>
            </div>
            <div class="col-sm-4 col-sm-offset-2">
                <div class="input-group">
                    <input type="text" ng-model="invoices.invoices.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search" ng-model-options='{debounce: 1000}' ng-change="invoices.updatePage();">
                    <span class="input-group-addon"><i class="fa fa-search"></i></span>
                </div>
            </div>
        </div>

        <div class="row margin-top-10">
            <div class="col-sm-12">
                <div class="btn-group">
                    <a class="btn btn-default" ng-click="invoices.showCreatedBetweenFilter = false; invoices.showPaidBetweenFilter = (!invoices.showPaidBetweenFilter)">
                        {{_('Betaldatum')}} 
                        <span ng-if="invoices.invoices.paid_at_start"><% invoices.invoices.paid_at_start | date:'yyyy-MM-dd' %> - </span>
                        <span ng-if="invoices.invoices.paid_at_end"><% invoices.invoices.paid_at_end | date:'yyyy-MM-dd' %></span>
                        <i class="fa" ng-class="{'fa-angle-down': !invoices.showPaidBetweenFilter, 'fa-angle-up': invoices.showPaidBetweenFilter}"></i>
                    </a>
                    <a class="btn btn-default" ng-class="{'disabled': !invoices.invoices.paid_at_start && !invoices.invoices.paid_at_end}" ng-click="invoices.invoices.paid_at_start = null; invoices.invoices.paid_at_end = null; invoices.updatePage();"><i class="fa fa-times"></i></a>
                </div>

                <div class="btn-group margin-left-10">
                    <a class="btn btn-default" ng-click="invoices.showPaidBetweenFilter = false; invoices.showCreatedBetweenFilter = (!invoices.showCreatedBetweenFilter)">
                        {{_('Fakturadatum')}} 
                        <span ng-if="invoices.invoices.created_at_start"><% invoices.invoices.created_at_start | date:'yyyy-MM-dd' %> - </span>
                        <span ng-if="invoices.invoices.created_at_end"><% invoices.invoices.created_at_end | date:'yyyy-MM-dd' %></span>
                        <i class="fa" ng-class="{'fa-angle-down': !invoices.showCreatedBetweenFilter, 'fa-angle-up': invoices.showCreatedBetweenFilter}"></i>
                    </a>
                    <a class="btn btn-default" ng-class="{'disabled': !invoices.invoices.created_at_start && !invoices.invoices.created_at_end}" ng-click="invoices.invoices.created_at_start = null; invoices.invoices.created_at_end = null; invoices.updatePage();"><i class="fa fa-times"></i></a>
                </div>
            </div>
        </div>
        
        <div class="row margin-top-10" ng-show="invoices.showPaidBetweenFilter">
            <div class="col-sm-12">
                <div class="well well-sm">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div uib-datepicker ng-model="invoices.invoices.paid_at_start"></div>
                        <div style="font-size: 26px;">{{_('till')}}</div>
                        <div uib-datepicker ng-model="invoices.invoices.paid_at_end"></div>
                    </div>
                    <a class="btn btn-success margin-top-10" ng-click="invoices.updatePage()">{{_('Tillämpa')}}</a>
                </div>
            </div>
        </div>

        <div class="row margin-top-10" ng-show="invoices.showCreatedBetweenFilter">
            <div class="col-sm-12">
                <div class="well well-sm">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div uib-datepicker ng-model="invoices.invoices.created_at_start"></div>
                        <div style="font-size: 26px;">{{_('till')}}</div>
                        <div uib-datepicker ng-model="invoices.invoices.created_at_end"></div>
                    </div>
                    <a class="btn btn-success margin-top-10" ng-click="invoices.updatePage()">{{_('Tillämpa')}}</a>
                </div>
            </div>
        </div>

    </div>

    <div class="panel-body" ng-if="!invoices.invoices.data.length">
        {{_('Det finns inga fakturor att visa.')}}
    </div>


    <div class="table-responsive" ng-if="invoices.invoices.data.length">
        <table class="table table-hover table-bordered">
            <thead>
                <tr>
                    <th>{{_('Datum')}}</th>
                    <th>{{_('Fakturnr')}}</th>
                    <th>{{_('Mottagare')}}</th>
                    <th>{{_('Status')}}</th>
                    <th>{{_('Betaldatum')}}</th>
                    <th class="text-right">{{_('Anmälningar')}}</th>
                    <th class="text-right">{{_('Lag')}}</th>
                    <th class="text-right">{{_('Summa')}}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr ng-repeat="invoice in invoices.invoices.data">
                    <td ui-sref="club.invoices.show({id:invoice.id})"><% invoice.invoice_date %></td>
                    <td ui-sref="club.invoices.show({id:invoice.id})"><% invoice.invoice_reference %></td>
                    <td ui-sref="club.invoices.show({id:invoice.id})"><% invoice.recipient_name %></td>
                    <td class="nowrap"><% invoice.payment_status %></td>
                    <td>
                        <span ng-if="invoice.paid_at"><% invoice.paid_at | dateToISO | date:"yyyy-MM-dd" %></span>
                        <button class="btn btn-xs btn-primary" ng-if="!invoice.paid_at" ng-click="invoices.openPaymentModal(invoice)">{{_('Registrera')}}</button>
                    </td>
                    <td ui-sref="club.invoices.show({id:invoice.id})" class="text-right"><% invoice.signups_count %></td>
                    <td ui-sref="club.invoices.show({id:invoice.id})" class="text-right"><% invoice.teams_count %></td>
                    <td ui-sref="club.invoices.show({id:invoice.id})" class="text-right"><% invoice.amount %></td>
                    <td class="text-right">
                        <button ng-click="invoices.download(invoice);" class="btn btn-xs btn-default"><i class="fa fa-download"></i> Ladda ner</button>
                        <button class="btn btn-xs btn-default" ui-sref="club.invoices.show({id:invoice.id})">{{_('Visa')}}</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="panel-footer" ng-if="invoices.invoices.data.length">
        <div class="row">
            <div class="col-lg-10 col-md-8 col-sm-8 col-xs-6">
                <div uib-pagination
                        total-items="invoices.invoices.total"
                        ng-model="invoices.invoices.current_page"
                        items-per-page="invoices.invoices.per_page"
                        max-size="5"
                        ng-change="invoices.updatePage()"
                        class="margin-0"
                        boundary-links="true"
                        rotate="false"
                        first-text="{{_('Första')}}"
                        last-text="{{_('Sista')}}"
                        next-text="{{_('&raquo;')}}"
                        previous-text="{{_('&laquo;')}}"
                ></div>
                <button class="btn btn-default pull-right" ng-click="invoices.print()"><i class="fa fa-print"></i></button>
            </div>
            <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                <select ng-model="invoices.invoices.per_page" ng-options="n for n in [5,10,25,50,100]" class="form-control text-right" ng-change="invoices.updatePage();">
                </select>
            </div>
            <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                <input type="number" min="1" ng-model="invoices.invoices.current_page" class="form-control text-right" ng-model-options='{debounce: 500}' ng-change="invoices.updatePage();">
            </div>
        </div>
    </div>

</div>


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
