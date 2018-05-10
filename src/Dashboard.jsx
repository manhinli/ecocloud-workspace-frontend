import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Row, Col, Container, Progress } from 'reactstrap';
import 'react-block-ui/style.css';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faPlusCircle from '@fortawesome/fontawesome-free-solid/faPlusCircle';
import faServer from '@fortawesome/fontawesome-free-solid/faServer';
import faFolderOpen from '@fortawesome/fontawesome-free-solid/faFolderOpen';
import faSearchPlus from '@fortawesome/fontawesome-free-solid/faSearchPlus';
import * as actions from './projects/actions';
import { getProjects, getUser, getAuthenticated, getStats } from './reducers';
import { ProjectsTableBasic } from './projects';

const FeedMe = require('feedme');

function mapStateToProps(state) {
  return {
    user: getUser(state),
    isAuthenticated: getAuthenticated(state),
    projects: getProjects(state),
    stats: getStats(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
  };
}

function formatDate(date) {
  const formattedDate = new Date(date);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const string = `${formattedDate.getDate()} ${months[formattedDate.getMonth()]} ${formattedDate.getFullYear()}`;

  return string;
}

function bytesToSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return 'n/a';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  if (i === 0) return `${bytes} ${sizes[i]})`;
  return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
}

class Dashboard extends React.Component {
  static propTypes = {
    user: PropTypes.objectOf(PropTypes.any).isRequired,
    projects: PropTypes.arrayOf(PropTypes.any).isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
    stats: PropTypes.objectOf(PropTypes.any).isRequired,
  }

  state = {
    feed: [],
  }

  componentWillMount() {
    this.getFeed();
  }
  componentDidMount() {
    this.props.dispatch(actions.projectsList());
    this.props.dispatch(actions.getStats());
  }

  getFeed = () => {
    fetch('http://www.ecocloud.org.au/category/notifications/feed/')
      .then(res => res.text())
      .then((body) => {
        const parser = new FeedMe(false);
        const feed = [];
        // register all event handlers before we push data into the parser
        parser.on('item', (item) => {
          // need to format date string
          const desc = item.description.substring(0, 80);
          const date = formatDate(item.pubdate);
          const feedItem = (
            <li key={item.link}>
              <p><strong>{date}</strong></p>
              <p>{item.title}</p>
              <p><span dangerouslySetInnerHTML={{ __html: desc }} /> <a href={item.link} target="_blank">... Read more</a></p>
            </li>
          );
          feed.push(feedItem);
        });
        parser.on('end', () => {
          console.log('parser finished');
          this.setState({ feed });
        });
        // write is a blocking call
        parser.write(body);
        // trigger end event handler ....
        // could just do setState here as well
        parser.end();
      });
  }

  render() {
    const {
      user, projects, isAuthenticated, stats,
    } = this.props;

    const used = bytesToSize(stats.used);
    const total = bytesToSize(stats.quota);
    const usageNum = `${used} / ${total}`;
    const usagePercent = (stats.used / stats.quota) * 100;

    return (
      <Container className="dashboard">
        <Row>
          <Col>
            {isAuthenticated &&
              <h1>Welcome {user.name}</h1>
            }
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 9 }}>
            <Row>
              <Col sm="12">
                <h2>Getting Started</h2>
                <Row>
                  <Col md="4">
                    <Link to="explorer" className="btn btn-lg btn-dashboard btn-success" title="Find Datasets in ecocloud Explorer">
                      <FontAwesomeIcon icon={faSearchPlus} /> <br /> Find datasets in <strong><em>Explorer</em></strong>
                    </Link>
                  </Col>
                  <Col md="4">
                    <Link to="drive" className="btn btn-lg btn-dashboard btn-success" title="Find Datasets in ecocloud Explorer">
                      <FontAwesomeIcon icon={faFolderOpen} /> <br /> Manage files in <strong><em>Drive</em></strong>
                    </Link>
                  </Col>
                  <Col md="4">
                    <Link to="compute" className="btn btn-lg btn-dashboard btn-success" title="Find Datasets in ecocloud Explorer">
                      <FontAwesomeIcon icon={faServer} /> <br /> Start a service in <strong><em>Compute</em></strong>
                    </Link>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col sm="12">
                <div className="storage">
                  <h2>Your Resources</h2>
                  <p>Storage Space <span className="storage-int">{usageNum}</span></p>
                  <Progress color="warning" value={usagePercent} />
                </div>
              </Col>
            </Row>
            <Row>
              <Col sm="12">
                <div className="home-projects-table">
                  <h2>Your Projects</h2>
                  <ProjectsTableBasic projects={projects} />
                  <div className="table-footer">
                    <Link to="drive" title="Create new project on ecocloud Drive" className="btn btn-lg btn-success"><FontAwesomeIcon icon={faPlusCircle} /> Create New Project</Link>
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
          <Col sm={{ size: 3 }}>
            <Row>
              <h2>Notifications</h2>
              <div className="dash-activity">
                <ul>{ this.state.feed }</ul>
              </div>
            </Row>
          </Col>
        </Row>
      </Container>
    );
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
