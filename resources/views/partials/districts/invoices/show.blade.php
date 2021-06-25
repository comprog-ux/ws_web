<div class="panel panel-default">
    <div class="panel-heading">{{_('Faktura')}}</div>
    <div class="panel-navigation text-right">
        <button ng-click="invoices.download(invoices.invoice);" class="btn btn-sm btn-default"><i class="fa fa-download"></i> Ladda ner</button>
    </div>
    <div class="panel-body">
        <div class="row">
            <div class="col-xs-6">
                <h4>{{_('Avsändare')}}</h4>
                <h3 class="margin-0"><% invoices.invoice.sender_name %></h3>
                <div class="break-lines"><% invoices.invoice.sender_address_combined %></div>
            </div>
            <div class="col-xs-6">
                <h4>{{_('Mottagare')}}</h4>
                <h3 class="margin-0"><% invoices.invoice.recipient_name %></h3>
                <div class="break-lines"><% invoices.invoice.recipient_address_combined %></div>
            </div>
        </div>

        <hr>
        <div class="row">
            <div class="col-xs-6 col-sm-4">
                <div class="row">
                    <div class="col-xs-6">
                        <label>{{_('Fakturanr')}}</label><br>
                    </div>
                    <div class="col-xs-6 text-right">
                        <% invoices.invoice.invoice_reference %>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>{{_('Datum')}}</label><br>
                    </div>
                    <div class="col-xs-6 text-right">
                        <% invoices.invoice.invoice_date %>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>{{_('Förfallodatum')}}</label><br>
                    </div>
                    <div class="col-xs-6 text-right">
                        <% invoices.invoice.expiration_date %>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>{{_('Summa')}}</label><br>
                    </div>
                    <div class="col-xs-6 text-right">
                        <% invoices.invoice.amount %>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>{{_('Status')}}</label><br>
                    </div>
                    <div class="col-xs-6 text-right">
                        <% invoices.invoice.payment_status %>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>{{_('Betaldatum')}}</label><br>
                    </div>
                    <div class="col-xs-6 text-right">
                        <% invoices.invoice.paid_at | dateToISO | date:"yyyy-MM-dd" %>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>{{_('Swish')}}</label><br>
                    </div>
                    <div class="col-xs-6 text-right">
                        <% (invoices.invoice.sender_swish) ? invoices.invoice.sender_swish : '-' %>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>{{_('Bankgiro')}}</label><br>
                    </div>
                    <div class="col-xs-6 text-right">
                        <% (invoices.invoice.sender_bankgiro) ? invoices.invoice.sender_bankgiro : '-' %>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <label>{{_('Postgiro')}}</label><br>
                    </div>
                    <div class="col-xs-6 text-right">
                        <% (invoices.invoice.sender_postgiro) ? invoices.invoice.sender_postgiro : '-' %>
                    </div>
                </div>
            </div>
            <div class="col-xs-6 col-sm-offset-2 col-xs-offset-0 col-sm-6">
                <div class="well well-sm">
                    <h4>Betalning?</h4>
                    <p>{{_('Fakturan betalas in till angivet BankGiro eller PostGiro. Använd angivet Fakturanr som referens.')}}</p>
                </div>
            </div>
        </div>
    </div>

    <div class="table-responsive">
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>{{(_('Beskrivning'))}}</th>
                    <th class="text-right">{{(_('Pris'))}}</th>
                    <th class="text-right">{{(_('Antal'))}}</th>
                    <th class="text-right">{{(_('Summa'))}}</th>
                </tr>
            </thead>
            <tbody>
                <tr ng-repeat="row in invoices.invoice.invoice_rows">
                    <td><% row.description %></td>
                    <td class="text-right"><% row.net_unit_amount %></td>
                    <td class="text-right"><% row.quantity %> <% row.unit %></td>
                    <td class="text-right"><% row.row_net_amount %></td>
                </tr>
            </tbody>
            <tfood>
                <tr>
                    <td colspan="3" class="text-right"><b>{{_('Att betala')}}</b></td>
                    <td class="text-right"><b><% invoices.invoice.amount %></b></td>
                </tr>
            </tfood>
        </table>
    </div>
</div>
<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Anmälningar kopplade till denna faktura')}}</div>
            <div class="col-sm-6 text-right">{{_('Antal anmälningar')}}: <% invoices.invoice.signups.length %></div>
        </div>
    </div>

    <div class="table-responsive">
        <table class="table table-hover table-bordered">
            <thead>
            <tr>
                <th>{{_('Användare')}}</th>
                <th>{{_('Tävling')}}</th>
                <th>{{_('Vapengrupp')}}</th>
                <th class="text-right">{{_('Summa')}}</th>
            </tr>
            </thead>
            <tbody>
            <tr ng-repeat="signup in invoices.invoice.signups">
                <td><% signup.user.fullname %></td>
                <td><% signup.competition.date %> <% signup.competition.name %></td>
                <td><% (signup.competition.championships_id) ? signup.weaponclass.classname_general : signup.weaponclass.classname %></td>
                <td class="text-right"><% signup.registration_fee %></td>
            </tr>
            </tbody>
        </table>
    </div>
</div>
<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Lag kopplade till denna faktura')}}</div>
            <div class="col-sm-6 text-right">{{_('Antal lag')}}: <% invoices.invoice.teams.length %></div>
        </div>
    </div>

    <div class="table-responsive">
        <table class="table table-hover table-bordered">
            <thead>
            <tr>
                <th>{{_('Lag')}}</th>
                <th>{{_('Tävling')}}</th>
                <th>{{_('Vapengrupp')}}</th>
                <th class="text-right">{{_('Summa')}}</th>
            </tr>
            </thead>
            <tbody>
            <tr ng-repeat="team in invoices.invoice.teams">
                <td><% team.name %></td>
                <td><% team.competition.date %> <% team.competition.name %></td>
                <td><% team.weapongroup.name %></td>
                <td class="text-right"><% team.registration_fee %></td>
            </tr>
            </tbody>
        </table>
    </div>
</div>
