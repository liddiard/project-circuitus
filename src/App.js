import React, { Component } from 'react';
import io from 'socket.io-client';
const socket = io('http://localhost:8081');

import './App.css';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uid: window.localStorage.getItem('uid') || this.generateUID(),
      // your name
      name: '',
      // your location
      position: {
        latitude: undefined,
        longitude: undefined, 
        accuracy: undefined,
        timestamp: undefined
      },
      // holds a timeout id from window.setTimeout if there is a change of
      // position "in the queue" to emit to socket
      timeoutId: undefined,
      // socket.io "room" which can contain other clients to which we are
      // sending our position
      room: window.location.pathname.substr(1),
      // whether or not this client has joined a room
      joinedRoom: false,
      // other clients in this room. key is their UID, value is name, object
      // containing their position info
      peers: {},
      // friends' initial positions, used to display progress from initial
      // positions to current position. same format as state.friends object
      initialPositions: {}
    };
  }

  componentDidMount() {

    window.localStorage.setItem('uid', this.state.uid);

    const name = window.prompt('Enter your name so the people you share your location with can identify you.');
    this.setState({ name: name });

    window.addEventListener('deviceorientation', event => {
      console.log(event.gamma);
    });

    // browser api for watching position changes. line below will prompt user
    // to give access to location
    navigator.geolocation.watchPosition(position => {
      this.handlePositionChange(position);
    });

    // listen for position changes from others in this room
    socket.on('position', data => {
      this.recievePosition(data);
    });

    // if no room UID in URL, user has come to root of website, create a new
    // room and join them to it
    if (!this.state.room.length) {
      this.setState({
        room: this.generateUID()
      }, () => {
        window.history.replaceState(null, null, this.state.room);
        this.joinRoom(this.state.room);
      });
    }
    // else user has followed a link to a preexisting room, join that one
    else {
      this.joinRoom(this.state.room);
    }
  }

  generateUID() {
    // generate 8-character random alphanumeric string
    // http://stackoverflow.com/a/12502559/2487925
    // set upper limit because chrome represents numbers with higher
    // precision than other browsers
    return Math.random().toString(36).slice(2, 10)
  }

  joinRoom(room) {
    socket.emit('subscribe', { room: room });
    this.setState({ joinedRoom: true });
  }

  handlePositionChange(position) {
    const newPosition = {
      timestamp: position.timestamp,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };
    this.setState({ position: newPosition });
    if (!this.state.timeoutId) {
      window.setTimeout(() => {
        this.sendPosition();
      }, 1000 * this.props.sendPositionInterval)
    }
  }

  sendPosition() {
    if (!this.state.joinedRoom) return;
    this.setState({ timeoutId: null });
    const payload = {
      uid: this.state.uid, 
      name: this.state.name,
      position: this.state.position
    };
    console.log('sending position', payload);
    socket.emit('position', payload);
  }

  recievePosition(position) {
    const initialPositions = this.state.initialPositions;
    if (!initialPositions[position.uid]) {
      initialPositions[position.uid] = {
        name: position.name,
        position: position.position
      };
      this.setState({ initialPositions: initialPositions });
    }

    const peers = this.state.peers;
    peers[position.uid] = {
      name: position.name,
      position: position.position
    };
    this.setState({ peers: peers });

    console.log('receiving position', position);
  }

  distanceFromMe(position) {
    return (Math.sqrt(Math.pow(position.latitude - this.state.position.latitude, 2) + 
            Math.pow(position.longitude - this.state.position.longitude, 2)));
  }

  angleFromMe(position) {
    
  }

  render() {
    return (
      <div className="App">
        <div className="compass">
          
        </div>
      </div>
    );
  }
}

App.defaultProps = {
  // minimum number of seconds between sending position updates
  sendPositionInterval: 2
};