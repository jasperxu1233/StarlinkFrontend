import React, { Component } from "react";
import axios from "axios";
import { Spin } from "antd";
import { feature } from "topojson-client";
import { geoKavrayskiy7 } from "d3-geo-projection";
import { geoGraticule, geoPath } from "d3-geo";
import { select as d3Select } from "d3-selection";
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";

import {
    WORLD_MAP_URL,
    SATELLITE_POSITION_URL,
    SAT_API_KEY,
} from "../constants";

const width = 960;
const height = 600;

class WorldMap extends Component {

    constructor(){
        super();
        this.state = {
            isLoading: false,
            isDrawing: false,
        };

        this.refMap = React.createRef(); //ref用来拿到页面上元的ref，因为canvas要getelemetbyid   画布1
        this.map = null;
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
        this.refTrack = React.createRef();  //画布2
    }

    componentDidMount() {           //上树阶段就 获取地图的元素，画出世界地图
        axios.get(WORLD_MAP_URL)     //通过url得到世界地图的数据
            .then(res => {
                const { data } = res;  //拆数据
                const land = feature(data, data.objects.countries).features;  //利用topjson解析世界地图数据
                this.generateMap(land);//将land丢给负责画图的方法
            })
            .catch(e => console.log('err in fecth world map data ', e))
    }

    componentDidUpdate(prevProps, prevState) { //通过props的状态改变，引起update阶段，先rerender后didupdate
        if (prevProps.satData !== this.props.satData) {   //进入之后，因为didupdate里面有setstate的变化，所以要设置条件，否则无限循环
            const { latitude, longitude, elevation, duration } = this.props.observerData; //将填入的卫星搜索信息解构
            const endTime = duration * 60;  //实际持续时间是以60秒为单位的，即未来的endTime（秒数）*60

            this.setState({
                isLoading: true,  //先设置加载状态为true
            });

            const urls = this.props.satData.map((sat) => { //将卫星一个一个向server索取位置信息，以promise返回存放在一个array里面
                const { satid } = sat;
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;

                return axios.get(url);
            });

            Promise.all(urls)
                .then((res) => {  //随后将得到的所有promise取出里面所有的data并存放在arr里面
                    const arr = res.map((sat) => sat.data);
                    this.setState({
                        isLoading: false, //设置loading为false
                        isDrawing: true, //设置drawing为true之后就开始画
                    });

                    if (!prevState.isDrawing) { //如果之前的绘画状态为false的话才会画，否则直接贴出跑完再画！
                        this.track(arr);
                    } else {
                        const oHint = document.getElementsByClassName("hint")[0];
                        oHint.innerHTML =
                            "Please wait for these satellite animation to finish before selection new ones!";
                    }
                })
                .catch((e) => {
                    console.log("err in fetch satellite position -> ", e.message);
                });
        }
    }

    track = (data) => {
        if (!data[0].hasOwnProperty("positions")) {  //sanity check，如果不存在数据则直接抛异常
            throw new Error("no position data");
        }


        const len = data[0].positions.length;  //得到持续时间的总长度，实际以分钟为单位
        const { context2 } = this.map;

        console.log("data");

        console.log(data);

        let now = new Date();  //最初开始的时间

        let i = 0;

        let timer = setInterval(() => { //每隔1000毫秒-->1秒执行一次
            let ct = new Date();  //得到当时的时间

            let timePassed = i === 0 ? 0 : ct - now;  //计算出过去了多久的时间
            let time = new Date(now.getTime() + 60 * timePassed);  //过去多久的时间 + 最开始的时间 == 现在的时间

            context2.clearRect(0, 0, width, height); //清理画布

            context2.font = "bold 14px sans-serif";
            context2.fillStyle = "#333";
            context2.textAlign = "center";
            context2.fillText(d3TimeFormat(time), width / 2, 10);  //设置显示时间的字体等参数，并且显示出来

            if (i >= len) {
                clearInterval(timer); //如果超过了所规定的显示时间，则将setInterval清除
                this.setState({ isDrawing: false }); //并且设置画画状态为false
                const oHint = document.getElementsByClassName("hint")[0]; //设置标题的内容为空
                oHint.innerHTML = "";
                return;
            }

            data.forEach((sat) => {
                const { info, positions } = sat;  //将data解构出来，包含卫星的metadata和具体位置
                this.drawSat(info, positions[i]);  //一秒钟一次将所有点一个一个画在地图上，然后擦掉，然后再按位置一个一个画上去
            });

            i += 60;
        }, 1000);
    };

    drawSat = (sat, pos) => {
        const { satlongitude, satlatitude } = pos; //将维度经度解构出来

        if (!satlongitude || !satlatitude) return; //维度或者经度为0直接返回

        const { satname } = sat; //名字解构出来
        const nameWithNumber = satname.match(/\d+/g).join(""); //卫星的名字用起数字代表

        const { projection, context2 } = this.map; //map解构出地图和点的坐标
        const xy = projection([satlongitude, satlatitude]); //将点的坐标设置在地图上

        context2.fillStyle = this.color(nameWithNumber); //卫星的名字设置颜色
        context2.beginPath();  //开始画点
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI); //点的位置的弧线？
        context2.fill(); //填充颜色

        context2.font = "bold 11px sans-serif";  //设置字体
        context2.textAlign = "center"; //设置围绕方式
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14); //设置名字围绕方位
    };

    generateMap = (land) => {   //画世界地图的function
        const projection = geoKavrayskiy7() //标准世界地图展现方式
            .scale(170)                         //调配，类似于大小
            .translate([width / 2, height / 2]) //宽高比
            .precision(.1);                  //精度

        const graticule = geoGraticule();  //经纬线网格

        const canvas = d3Select(this.refMap.current) //元素的ref传给d3 , 调整画布的属性
            .attr("width", width)
            .attr("height", height);

        const canvas2 = d3Select(this.refTrack.current)
            .attr("width", width)
            .attr("height", height);


        let context = canvas.node().getContext("2d"); //2d的
        const context2 = canvas2.node().getContext("2d");

        let path = geoPath()         //路径的变量
            .projection(projection)
            .context(context);

        land.forEach(ele => {
            context.fillStyle = '#B3DDEF';  //填充色颜色
            context.strokeStyle = '#000';   //线条颜色
            context.globalAlpha = 0.7;     //线的比例
            context.beginPath();         //开始作画
            path(ele);               //笔能读懂的数据
            context.fill();              //填颜色
            context.stroke();      //画线

            context.strokeStyle = 'rgba(220, 220, 220, 0.1)';    //颜色
            context.beginPath();
            path(graticule());             //画经纬度
            context.lineWidth = 0.1;
            context.stroke();

            context.beginPath();
            context.lineWidth = 0.5;       //画最外圈的线，d3最外圈的线是不画的
            path(graticule.outline());
            context.stroke();
        })


        this.map = {
            context : context,
            context2 : context2,
            projection :projection,
            graticule : graticule
        }
    }


    render() {
        const { isLoading } = this.state;
        return (
            <div className="map-box">
                {isLoading ? (  //加载的话就是加载，不记载的话就是显示出 画布1 以及 画布2
                    <div className="spinner">
                        <Spin tip="Loading..." size="large" />
                    </div>
                ) : null}
                <canvas className="map" ref={this.refMap} />
                <canvas className="track" ref={this.refTrack} />
                <div className="hint" />
            </div>
        );
    }
}

export default WorldMap;