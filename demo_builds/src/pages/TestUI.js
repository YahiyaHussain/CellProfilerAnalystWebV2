import React from 'react';
import { Row, Col} from "reactstrap";
import {Box, Button, Grid, IconButton, Menu, MenuItem, Card}from '@material-ui/core'; 
import logo from '../cpa_full_logo.png';
import {Image, Dropdown, DropdownButton} from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.css";
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import BelladndTest from './BelladndTest'

function TestUI(){
    
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };
    
    return (
        // <div style = {{backgroundColor:"#ededed"}}>
        
        <div style = {{overflowX:"hidden", height: "100%" , width: "100%", position: "relative"}}>
        <Row>
       
        
        <Col>
        <Image src={logo} style={{marginLeft:"31%", height:'75%', width:'100%',position:"relative", marginTop:"5%", maxWidth:"300px"}}></Image>
        </Col>
        <Col >
        <IconButton style={{color: "black", marginLeft:"158%",  marginTop:"5%", height:'10%', width:'10%', backgroundPosition: "100%"}}> <CloudUploadIcon  /></IconButton> 
        </Col>
        <Col >
        <IconButton style={{color: "black", marginLeft:"61%", height:'10%', width:'10%', backgroundPosition: "100%", marginTop:"5%"}}> <SaveAltIcon /></IconButton> 
        </Col>
        


        </Row>
        <Row>
        
        <Grid container justify="center"  width="auto" spacing={2} style={{marginBottom: 15, marginTop: 10}}>
       
        <Grid key={0} item >
        {/* <DropdownButton variant="secondary" title= "Fetch">
        
         <Dropdown.Item >Positive</Dropdown.Item>
         <Dropdown.Item >Negative</Dropdown.Item>
         <Dropdown.Item >Random</Dropdown.Item>
        
        </DropdownButton> */}
            <Button variant="contained" aria-controls="simple-menu" aria-haspopup="true"  onClick={handleClick}  >
            Fetch
            </Button>
            <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
            >
            <MenuItem onClick={handleClose}>Random</MenuItem>
            <MenuItem onClick={handleClose}>Positive</MenuItem>
            <MenuItem onClick={handleClose}>Negative</MenuItem>
            <MenuItem onClick={handleClose}>Unclear</MenuItem>
            </Menu>
    </Grid>


        <Grid key={1} item>
        <Button variant="contained">Train</Button>
        </Grid>

        <Grid key={2} item>
        <Button variant="contained">EVALUATE</Button>
        </Grid>
    </Grid>
    </Row>

    
    <BelladndTest></BelladndTest>
   
    </div>
  

    );
}

export default TestUI; 