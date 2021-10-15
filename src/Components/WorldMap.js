import React, {Component} from 'react';
import { feature } from 'topojson-client';
import axios from 'axios';
import { geoKavrayskiy7 } from 'd3-geo-projection';
import { geoGraticule, geoPath } from 'd3-geo';
import { select as d3Select } from 'd3-selection';

import { WORLD_MAP_URL } from "../constants";

const width = 960;
const height = 600;

class WorldMap extends Component {
    land;

    constructor(){
        super();
        this.state = {
            map: null
        }
        this.refMap = React.createRef(); //ref用来拿到页面上元的ref，因为canvas要getelemetbyid
    }

    componentDidMount() {           //获取地图的元素
        axios.get(WORLD_MAP_URL)
            .then(res => {
                const { data } = res;  //拆数据
                const land = feature(data, data.objects.countries).features;  //利用topjson解析世界地图数据
                this.generateMap(land);//将land丢给负责画图的方法
            })
            .catch(e => console.log('err in fecth world map data ', e))
    }

    generateMap = (land) => {
        const projection = geoKavrayskiy7() //标准世界地图展现方式
            .scale(170)                         //调配，类似于大小
            .translate([width / 2, height / 2]) //宽高比
            .precision(.1);                  //精度

        const graticule = geoGraticule();  //经纬线网格

        const canvas = d3Select(this.refMap.current) //元素的ref传给d3 , 调整画布的属性
            .attr("width", width)
            .attr("height", height);

        let context = canvas.node().getContext("2d"); //2d的

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
    }


    render() {
        return (
            <div className="map-box">
                <canvas className="map" ref={this.refMap} />
            </div>
        );
    }
}

export default WorldMap;
