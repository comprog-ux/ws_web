<div class="row" ng-if="championships.championship">
    <div class="col-sm-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                {{_('Mästerskap')}} | <% championships.championship.name %>
            </div>

            <div class="panel-body">
                <div class="row">
                    <div class="col-sm-3">
                        <ul class="nav nav-pills nav-stacked">

                            <li>
                                <a ui-sref="championships.show.competitions({championships_id: championships.championship.id})">
                                    {{_('Tävlingar')}}
                                </a>
                            </li>
                            <li>
                                <a ui-sref="championships.show.signups({championships_id: championships.championship.id})">
                                    {{_('Anmälningar')}}
                                </a>
                            </li>

                        </ul>
                    </div>
                    <div class="col-sm-9">
                        <div ui-view="main"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>