import React, {Component} from 'react';
import { List, Avatar, Button, Checkbox, Spin } from 'antd';
import satellite from "../assets/images/satellite.svg";

class SatelliteList extends Component {
    state = {
        selected : [],  //selected数组来表示选中的卫星有哪些
    }

    onChange = (e) => { //checkBox的onChange函数会传入一个e
        const { dataInfo, checked } = e.target;  //点一下checkBox会执行函数后解构，随后得到checkbox的状态以及所点击的卫星信息
        const { selected } = this.state;  //将所有的selected数组里面的卫星信息解构出来放进这个selected里面
        const list = this.addOrRemove(dataInfo, checked, selected); //将 checkbox选择的卫星信息，是否选择，和所有选择的卫星作为参数放入函数
        this.setState({
            selected: list  //将更新过的卫星的array重新赋值给selected， 随后引起rerender。
        })
    }

    addOrRemove = (item, status, list) => { //选择的checkBox的卫星信息；选择状态；已选卫星的列表
        const found = list.some((entry) => entry.satid === item.satid); //遍历已选卫星的list，查找选择的卫星是否已存在已选择卫星的list里面。如果有的话则返回true否则就是false
        if(status && !found){ //如果用户选中，而且选的那个不在已选中的里面则加进去
            list.push(item)  //从数组中添加
        }

        if(!status && found){//如果用户取消，而且选的那个在已选的list的里面则取消掉
            list = list.filter( entry => {    //从数组中删除
                return entry.satid !== item.satid;
            });
        }
        return list; //将筛选过的卫星的array返回
    }

    onShowSatMap = () =>{
        this.props.onShowMap(this.state.selected);//点击track按键之后，引起父组件的onShowMao函数的调用并且将selected传入父组件的该函数
    }

    render() {
        const satList = this.props.satInfo ? this.props.satInfo.above : []; //全部的卫星数据存放在satList里面
        const { isLoad } = this.props;  //解构拿到isLoad的数据,来判断是否要加载。
        const { selected } = this.state; //rerender之后，selected得到所有要选择展示的卫星数据（每个卫星都是一个obj的数据）

        return (
            <div className="sat-list-box">
                <Button className="sat-list-btn"
                        size="large"
                        disabled={ selected.length === 0}//如果选择卫星的array长度为0的话，则把track按键隐藏掉
                        onClick={this.onShowSatMap} //按下track按键之后，会调用onShowSatMap function。
                >Track on the map</Button>
                <hr/>
                {
                    isLoad ? //通过isLoad状态得到展示前一个还是后一个标签的目的， 前一个就是正在加载中:后一个就是所有在范围内的卫星的一个列表
                        <div className="spin-box">
                            <Spin tip="Loading..." size="large" />
                        </div>
                        :
                    <List
                        className="sat-list"
                        itemLayout="horizontal"
                        size="small"
                        dataSource={satList}   //所有的卫星信息在satList里面。
                        renderItem={item => (  //将所有卫星一个一个的展示出来。
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