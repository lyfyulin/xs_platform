import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import AddAccidents from './add'
import AccidentsInfo from './accidents-info'
import AccidentsDetail from './accidents-detail'
import AccidentsEliminate from './accidents-eliminate'

export default class Accidents extends Component {
    render() {
        return (
            <Switch>
                <Route path="/accidents" exact component={ AccidentsInfo }/>
                <Route path="/accidents/add" component={ AddAccidents }/>
                <Route path="/accidents/eliminate" component={ AccidentsEliminate }/>
                <Route path="/accidents/detail/:id" component={ AccidentsDetail }/>
            </Switch>
        )
    }
}
