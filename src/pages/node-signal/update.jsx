import React, { Component } from 'react'
import LinkButton from '../../components/link-button'
import { Icon, Card, Form, Input, InputNumber, Select, Button, message, TimePicker, Radio } from 'antd'
import moment from 'moment'
import 'moment/locale/zh-cn'
import memoryUtils from '../../utils/memoryUtils';
import { PHASE_SCHEMA, PHASE_SCHEMA_FLOW } from '../../utils/ConstantUtils';
import SignalSchema from './signal-schema'
import { getTimeString, getTodayDateString, getFutureDateString } from '../../utils/dateUtils'
import { reqInsertNodeSchema, reqNodeSchemaById, reqUpdateNodeSchema, reqNodeById } from '../../api'
import { vector } from '../../utils/ArrayCal'

const Item = Form.Item
const Option = Select.Option

class UpdateSchema extends Component {

    state = {
        phase_number: 2,
        phases: [],
        schema_phases: [],
        inter_type: 0,
    }

    phaseNumberChange = phase_number => {
        this.setState({ phase_number })
    }

    getValues = () => {
        let result = undefined
        this.props.form.validateFields( async (err, values) => {
            if( !err ){
                result = this.convertData(values)
            }else{
                message.error("数据提交失败！")
            }
        } )
        return result
    }

    viewSchema = () => {
        let signal_schema = this.getValues()
        let phases = vector.property_unique(signal_schema.phases, "phase_index")
        this.setState({ phases })
    }

    // 将数据转化为 插入格式
    convertData = (schema) => {

        let signal_schema = {}

        let data = Object.entries(schema)
        let phase_schema_list = data.filter( (item, index) => item[0].indexOf("phase_schema") !== -1 )
        let phase_time_list = data.filter( (item, index) => item[0].indexOf("phase_time") !== -1 )
        let schema_property = data.filter( (item, index) => item[0].indexOf("phase_time") === -1 && item[0].indexOf("phase_schema") === -1 )

        let phase_schema = phase_schema_list.map( e => e[1] )
        
        let phase_time = phase_time_list.map( e => e[1] )
        let phases = []
        
        phase_schema.forEach( (schema, index) => {
            PHASE_SCHEMA_FLOW[schema].forEach( (e, i) => phases.push({ phase_index: index + 1, phase_schema: schema, phase_time: phase_time[index], direction: e[0], turn_dir: e[1] }) )
        } )
        
        let start_time = getTimeString(schema["start_time"])
        let end_time = getTimeString(schema["end_time"])

        schema_property.forEach( e => signal_schema[e[0]] = e[1] )
        signal_schema['node_schema_id'] = memoryUtils.node_schema.node_schema_id
        signal_schema['phases'] = phases
        signal_schema['node_id'] = memoryUtils.node.node_id
        signal_schema['start_time'] = getTodayDateString() + " " + start_time
        signal_schema['end_time'] = getTodayDateString() + " " + end_time
        signal_schema['start_date'] = "2020-01-01"
        signal_schema['end_date'] = getFutureDateString()
        signal_schema['phase_schema'] = phase_schema.join(",")
        signal_schema['phase_time'] = phase_time.join(",")
        signal_schema['schema_cycle'] = eval(phase_time.join("+"))

        return signal_schema
    }
    
    handleSubmit = async (e) => {
        e.preventDefault()
        let signal_schema = this.getValues()
        const result = await reqUpdateNodeSchema(signal_schema)
        result.code === 1?message.success("更新信号方案成功！")&&this.props.history.replace("/node-signal"):message.error(result.message)
    }

    loadNodeSchemaById = async (node_schema_id) => {
        const result = await reqNodeSchemaById(node_schema_id)
        if(result.code === 1){
            let node_schema = result.data
            let schema_phases = vector.property_unique(node_schema.phases, 'phase_index')
            node_schema.phases = schema_phases
            memoryUtils.node_schema = node_schema
            this.node_schema = node_schema

            this.setState({ phases: schema_phases, schema_phases: schema_phases, phase_number: schema_phases.length })
        } else {
            message.error(result.message)
        }
    }

    loadNodeById = async () => {
        let node = memoryUtils.node
        if(node.node_id){
            const result = await reqNodeById(node.node_id)
            if(result.code === 1){
                let directions = result.data.directions.map( e => e.direction )
                if(directions.length === 4){
                    this.setState({ inter_type: 0 })
                }else if(directions.length === 3 && directions[0] === 2){
                    this.setState({ inter_type: 1 })
                }else if(directions.length === 3 && directions[1] === 3){
                    this.setState({ inter_type: 2 })
                }else if(directions.length === 3 && directions[2] === 4){
                    this.setState({ inter_type: 3 })
                }else if(directions.length === 3){
                    this.setState({ inter_type: 4 })
                }
            }
        }
    }

    componentDidMount() {
        this.loadNodeById()
        let node_schema = memoryUtils.node_schema
        
        if(node_schema.node_schema_id){
            this.loadNodeSchemaById(node_schema.node_schema_id)
        }else{
            message.error("未加载到数据！")
        }
    }
    

    componentWillUnmount() {
        this.setState = (state, callback) => {
          return
        }
    }

    render() {

        const node = memoryUtils.node

        const { phases, phase_number,schema_phases, inter_type } = this.state

        const { getFieldDecorator } = this.props.form
        
        const title = (
            <span>
                <LinkButton onClick={ () => this.props.history.goBack() }>
                    <Icon type="arrow-left"></Icon>
                </LinkButton>
                &nbsp;&nbsp;
                <span>信号方案</span>
            </span>
        )

        const formLayout = {
            labelCol : { span: 10 } ,
            wrapperCol : { span: 14 },
        }

        return (
            <Card className="full" title={title} style={{ margin: 0, padding: 0,  }}>
                <div className="full" style={{ display: 'flex', flexWrap: 'nowrap' }}>
                    <Form
                        className="lyf-col-5"
                        { ...formLayout }
                        onSubmit = { this.handleSubmit }
                    >
                        <div className="lyf-row-8 lyf-center">
                            <Item label="交叉口名称">
                                {
                                    getFieldDecorator("node_name", {
                                        initialValue: node.node_name,
                                    })(<Input />)
                                }
                            </Item>
                            <Item label="阶段数">
                                {
                                    getFieldDecorator("phase_number", {
                                        initialValue: this.node_schema?schema_phases.length:2,
                                        rule: [],
                                    })(
                                        <InputNumber 
                                            min={2} 
                                            max={10}
                                            onChange = { this.phaseNumberChange }
                                        />
                                    )
                                }
                            </Item>
                            {
                                (schema_phases.length === phase_number ?new Array(schema_phases.length):new Array(phase_number)).toString().split(",").map( (e, i) =>{
                                
                                    let phase_schema = schema_phases[i]||{}

                                return <div style={{ width: '100%' }} key={i}>
                                    <Item label={ '阶段' + (i + 1) }>
                                        {
                                            getFieldDecorator("phase_schema_" + (i + 1), {
                                                initialValue: phase_schema.phase_schema||'0',
                                            })(
                                                <Select>
                                                    {
                                                        Object.entries(PHASE_SCHEMA).map( (e, i) => <Option key={ i } value={ e[0] }>{ e[1] }</Option> )
                                                    }
                                                </Select>
                                            )
                                        }
                                    </Item>
                                    <Item label={ '阶段' + (i + 1) + '时长' }>
                                        {
                                            getFieldDecorator("phase_time_" + (i + 1), {
                                                initialValue: phase_schema.phase_time||10,
                                            })(
                                                <InputNumber
                                                style={{ width: '90%' }}
                                                    min={0} 
                                                    max={100}
                                                />
                                            )
                                        } &nbsp; s
                                    </Item>
                                </div>}
                                )
                            }
                            <Item label="起始时间">
                                {
                                    getFieldDecorator("start_time", {
                                        initialValue: moment(this.node_schema?this.node_schema.start_time:"2020-01-01 00:00:00"),
                                    })(
                                        <TimePicker 
                                            style={{ width:'100%' }} 
                                            placeholder="请选择时间" 
                                            size="small"
                                            format = "HH:mm:ss"
                                        />
                                    )
                                }
                            </Item>
                            <Item label="结束时间">
                                {
                                    getFieldDecorator("end_time", {
                                        initialValue: moment(this.node_schema?this.node_schema.end_time:"2020-01-01 23:59:59"),
                                    })(
                                        <TimePicker 
                                            style={{ width:'100%' }} 
                                            placeholder="请选择时间" 
                                            size="small"
                                            format = "HH:mm:ss"
                                        />
                                    )
                                }
                            </Item>
                            <Item label="相位差">
                                {
                                    getFieldDecorator("offset", {
                                        initialValue: this.node_schema?this.node_schema.offset:0,
                                    })(
                                        <InputNumber
                                            style={{ width: '90%' }}
                                            min={0} 
                                            max={200}
                                        />
                                    )
                                } &nbsp; s
                            </Item>
                            <Item label="是否执行">
                                {
                                    getFieldDecorator("execution", {
                                        initialValue: this.node_schema?(this.node_schema.execution+''):"0",
                                    })(
                                        <Radio.Group size="small">
                                            <Radio.Button value="1">执行</Radio.Button>
                                            <Radio.Button value="0">未执行</Radio.Button>
                                        </Radio.Group>
                                    )
                                }
                            </Item>
                            <Item label="方案描述">
                                {
                                    getFieldDecorator("description", {
                                        initialValue: this.node_schema?this.node_schema.description:"",
                                    })(<Input />)
                                }
                            </Item>
                        </div>
                        <div className="lyf-row-2 lyf-center">
                            <Button htmlType="submit">提交</Button>&nbsp;&nbsp;
                            <Button onClick = { this.viewSchema }>预览</Button>
                        </div>
                    </Form>
                    <div className="lyf-col-5">
                        <div style={{ height: 300 }}>
                            <SignalSchema data={ phases } inter_type={inter_type}/>
                        </div>
                    </div>
                </div>
            </Card>
        )
    }
}

export default Form.create()(UpdateSchema)
