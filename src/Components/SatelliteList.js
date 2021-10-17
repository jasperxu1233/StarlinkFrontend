import React, {Component} from 'react';
import { List, Avatar, Button, Checkbox, Spin } from 'antd';
import satellite from "../assets/images/satellite.svg";

class SatelliteList extends Component {
    state = {
        selected : [],  //selected数组来表示选中的卫星有哪些
    }

    onChange = (e) => { //传入一个e
        const { dataInfo, checked } = e.target;  //点一下得到checkbox的状态以及信息
        const { selected } = this.state;  //将所有的selected数组里面的卫星信息解构出来放进这个selected里面
        const list = this.addOrRemove(dataInfo, checked, selected); //讲 checkbox选择的卫星信息，是否选择，和所有选择的卫星放入函数参数
        this.setState({
            selected: list
        })
    }

    addOrRemove = (item, status, list) => {
        const found = list.some((entry) => entry.satid === item.satid);
        if(status && !found){ //如果用户选中，切选的那个不在已选中的里面则加进去
            list.push(item)  //从数组中添加
        }

        if(!status && found){//如果用户取消，切选的那个在已选中的里面则取消掉
            list = list.filter( entry => {    //从数组中删除
                return entry.satid !== item.satid;
            });
        }
        return list;
    }

    onShowSatMap = () =>{
        this.props.onShowMap(this.state.selected);
    }

    render() {
        const satList = this.props.satInfo ? this.props.satInfo.above : []; //全部的卫星数据存放在satList里面
        const { isLoad } = this.props;  //解构拿到isLoad的数据,来判断是否要加载。
        const { selected } = this.state;

        return (
            <div className="sat-list-box">
                <Button className="sat-list-btn"
                        size="large"
                        disabled={ selected.length === 0}
                        onClick={this.onShowSatMap}
                >Track on the map</Button>
                <hr/>
                {
                    isLoad ? //通过isLoad状态得到展示前一个还是后一个标签的目的
                        <div className="spin-box">
                            <Spin tip="Loading..." size="large" />
                        </div>
                        :
                    <List
                        className="sat-list"
                        itemLayout="horizontal"
                        size="small"
                        dataSource={satList}   //所有的卫星信息在satList里面。
                        renderItem={item => (  //展示出所有卫星的信息
                            <List.Item
                                actions={[<Checkbox dataInfo={item} onChange={this.onChange}/>]} //onChange是否选择一个卫星。选中或者取消
                            >
                                <List.Item.Meta
                                    avatar={<Avatar size={50} src={satellite} />}
                                    title={<p>{item.satname}</p>}
                                    description={`Launch Date: ${item.launchDate}`}
                                />

                            </List.Item>
                        )}
                    />

                }
            </div>
        );
    }
}

export default SatelliteList;
