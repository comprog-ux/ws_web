<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">
                {{_('Inkommande Fakturor')}}
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
                    <th>{{_('Avsändare')}}</th>
                    <th>{{_('Status')}}</th>
                    <th class="text-right">{{_('Anmälningar')}}</th>
                    <th class="text-right">{{_('Lag')}}</th>
                    <th class="text-right">{{_('Summa')}}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr ng-repeat="invoice in invoices.invoices.data">
                    <td ui-sref="districts.show.invoices.show({districts_id: district.district.id, id:invoice.id})"><% invoice.invoice_date %></td>
                    <td ui-sref="districts.show.invoices.show({districts_id: district.district.id, id:invoice.id})"><% invoice.invoice_reference %></td>
                    <td ui-sref="districts.show.invoices.show({districts_id: district.district.id, id:invoice.id})"><% invoice.sender_name %></td>
                    <td ui-sref="districts.show.invoices.show({districts_id: district.district.id, id:invoice.id})" class="nowrap"><% invoice.payment_status %></td>
                    <td ui-sref="districts.show.invoices.show({districts_id: district.district.id, id:invoice.id})" class="text-right"><% invoice.signups_count %></td>
                    <td ui-sref="districts.show.invoices.show({districts_id: district.district.id, id:invoice.id})" class="text-right"><% invoice.teams_count %></td>
                    <td ui-sref="districts.show.invoices.show({districts_id: district.district.id, id:invoice.id})" class="text-right"><% invoice.amount %></td>
                    <td class="text-right">
                        <button ng-click="invoices.download(invoice);" class="btn btn-xs btn-default"><i class="fa fa-download"></i> Ladda ner</button>
                        <button class="btn btn-xs btn-default" ui-sref="cdistricts.show.invoices.show({districts_id: district.district.id, id:invoice.id})">{{_('Visa')}}</button>
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
