import React, {Component} from 'react';
import Widget from '@wso2-dashboards/widget';

class StatsChart extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            page: null,
            componentName: null,
            entryPoint: null, // todo: Find out what this is for
            timeFrom: null,
            timeTo: null,
            timeUnit: null,
            totalCount: 0,
            failedCount: 0
        };
    }

    componentDidMount() {

        // Set page name
        this.setState({
            page: this.getCurrentPage()
        });

        this.retrieveStats();
    }

    /**
     * Get message count details from the DB
     */
    retrieveStats() {

    }

    /**
     * Display info message if date time or a component is not selected
     */
    checkParameterValidity() {
        if (this.state.page && this.state.componentName && this.state.timeTo && this.state.timeFrom == null) {
            switch (this.state.page.name) {
                case 'api':
                    return 'Please select an API and a valid date range to view stats.';
                    break;
                case 'proxy':
                    return 'Please select a Proxy Service and a valid date range to view stats.';
                    break;
                case 'sequences':
                    return 'Please select a Sequence and a valid date range to view stats.';
                    break;
                case 'endpoint':
                    return 'Please select an Endpoint and a valid date range to view stats.';
                    break;
                case 'inbound':
                    return 'Please select an Inbound Endpoint and a valid date range to view stats.';
                    break;
                default:
                    return 'Please select valid date range to view stats.';
            }
        }
        return null;
    }

    getCurrentPage() {
        var page, pageName;
        var href = parent.window.location.href;
        var lastSegment = href.substr(href.lastIndexOf('/') + 1);
        if (lastSegment.indexOf('?') == -1) {
            pageName = lastSegment;
        } else {
            pageName = lastSegment.substr(0, lastSegment.indexOf('?'));
        }
        return this.getGadgetConfig(pageName);
    };

    render() {
        return (
            <body>
            <div id={"canvas"}> {this.checkParameterValidity()} </div>
            </body>
        );
    }
}

global.dashboard.registerWidget('StatsChart', StatsChart);