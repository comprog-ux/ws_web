<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                {{_('Krets')}} | <% district.district.name %>
            </div>

            <div class="panel-body">
                <div class="row">
                    <div class="col-sm-3">

                        <div class="panel panel-default">
                            <div class="panel-heading">
                                {{_('Administration')}}
                            </div>
                            <ul class="nav nav-pills nav-stacked">
                                <li>
                                    <a ui-sref="districts.show({districts_id: district.district.id})">
                                        {{_('Information')}}
                                    </a>
                                </li>
                                <li>
                                    <a ui-sref="districts.show.invoices.index({districts_id: district.district.id})">
                                        {{_('Fakturaöversikt')}}
                                    </a>
                                </li>
                                <li class="divider"></li>
                                <li>
                                    <a ui-sref="districts.show.invoices.incoming({districts_id: district.district.id})">
                                        {{_('Inkommande Fakturor')}}
                                    </a>
                                </li>
                                <li>
                                    <a ui-sref="districts.show.invoices.outgoing({districts_id: district.district.id})">
                                        {{_('Skickade Fakturor')}}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="col-sm-9">
                        <div ui-view="main"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
