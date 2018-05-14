import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Input, InputGroup, InputGroupAddon, Label, Row, Col, Container } from 'reactstrap';
import { Link } from 'react-router-dom';
import ReduxBlockUi from 'react-block-ui/redux';
import 'react-block-ui/style.css';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faPlusCircle from '@fortawesome/fontawesome-free-solid/faPlusCircle';
import faCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes';
import faUpload from '@fortawesome/fontawesome-free-solid/faUpload';
import faServer from '@fortawesome/fontawesome-free-solid/faServer';
import { formatDate } from './utils';
import { Contents, PathBar } from './projects';
import * as actions from './projects/actions';
import { getContents, getProject, getPath } from './reducers';


function mapStateToProps(state, ownProps) {
  return {
    project: getProject(state, ownProps.match.params.id),
    contents: getContents(state),
    path: getPath(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    // contents
    onClick: (project, path) => {
      dispatch(actions.contentsPath({ project, path }));
    },
    onAddFolder: (project, path, folder) => {
      dispatch(actions.addFolder({ project, path, folder }));
    },
    onDeleteFolder: (project, path) => {
      dispatch(actions.deleteFolder({ project, path }));
    },
    onAddFile: (project, path, files) => {
      dispatch(actions.uploadFile({ project, path, files }));
    },
    onDeleteFile: (project, path, name) => {
      dispatch(actions.deleteFile({ project, path, name }));
    },
    dispatch,
  };
}


class ProjectsController extends React.Component {
  static defaultProps = {
    project: null,
  }

  static propTypes = {
    project: PropTypes.objectOf(PropTypes.any),
    contents: PropTypes.arrayOf(PropTypes.any).isRequired,
    path: PropTypes.string.isRequired,
    // event handlers
    onClick: PropTypes.func.isRequired,
    onAddFolder: PropTypes.func.isRequired,
    onDeleteFolder: PropTypes.func.isRequired,
    onAddFile: PropTypes.func.isRequired,
    onDeleteFile: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
  }

  state = {
    addFolder: false,
    newFolder: '',
    addFile: false,
    newFile: [],
  }

  componentDidMount() {
    // good place to trigger ajax data load
    // setState update will trigger render, but before browser updates => no flicker
    const { project } = this.props;
    if (!project) {
      // we need to load project list
      // this will trigger a componentDidUpdate when the list has been loaded
      this.props.dispatch(actions.projectsList());
    } else {
      // project already available on mount lifecycle ..., trigger a contents reload right away
      this.props.dispatch(actions.contentsPath({ project: project.name, path: '/' }));
    }
  }

  componentDidUpdate(prevProps) {
    // good place to trigger ajax, but should compare to props, to avoid
    // unnecessary ajax calls
    const { project } = this.props;
    if (project && (project !== prevProps.project)) {
      // project was not available on mount lifecycle, so we triffer loading contents
      // during update lifecycle
      this.props.dispatch(actions.contentsPath({ project: project.name, path: '/' }));
    }
  }

  onPath = (path) => {
    const { project, onClick } = this.props;
    onClick(project.name, path);
  }

  onDelete = (project, path, item) => {
    if (item.content_type === 'application/directory') {
      this.props.onDeleteFolder(project, [path, item.name].join('/'));
    } else {
      this.props.onDeleteFile(project, path, item.name);
    }
  }

  addFolder = () => {
    const { project, path, onAddFolder } = this.props;
    const { addFolder, newFolder } = this.state;
    if (addFolder) {
      // we hit the confirm button
      // validate input
      if (!newFolder) {
        return;
      }
      onAddFolder(project.name, path, { name: newFolder });
      this.setState({
        addFolder: false,
        newFolder: '',
      });
    } else {
      this.setState({ addFolder: true });
    }
  }

  cancelAddFolder = () => this.setState({ addFolder: false });

  changeNewFolder = e => this.setState({ newFolder: e.target.value });

  addFile = () => {
    const { project, path, onAddFile } = this.props;
    const { addFile, newFile } = this.state;
    if (addFile) {
      // we hit the confirm button
      // validate input
      if (!newFile) {
        return;
      }
      onAddFile(project.name, path, newFile);
      this.setState({
        addFile: false,
        newFile: [],
      });
    } else {
      this.setState({ addFile: true });
    }
  }

  cancelAddFile = () => this.setState({ addFile: false });

  changeNewFile = e => this.setState({ newFile: Array.from(e.target.files) });

  render() {
    const {
      project, contents, path,
      onClick,
    } = this.props;

    const {
      addFolder, newFolder,
      addFile, newFile,
    } = this.state;

    return (
      <Container>
        { project &&
          <ReduxBlockUi tag="div" block={actions.CONTENTS_PATH} unblock={[actions.CONTENTS_SUCCEEDED, actions.CONTENTS_FAILED]} className="loader">
            <Row>
              <Col>
                <Link to="/drive" className="back-crumb">&laquo; Back to <em><strong>Drive</strong></em></Link>
                <h1>{project.name}</h1>
                <p><strong>Date Created:</strong> {formatDate(project.created)}</p>
                <p>{project.description}</p>
              </Col>
            </Row>
            <Row>
              <Col>
                <h3>Project Contents</h3>
                <div className="project-pathbar">
                  <PathBar project={project.name} path={path} onClick={this.onPath} />
                </div>
              </Col>
            </Row>
            <div className="project-contents-table">
              <Row>
                <Col>
                  <Contents key="contents" contents={contents} project={project.name} path={path} onClick={onClick} onDelete={this.onDelete} />
                </Col>
              </Row>
              { addFolder &&
                <Row>
                  <Col>
                    <InputGroup key="folder">
                      <Input type="text" value={newFolder} onChange={this.changeNewFolder} required />
                      <InputGroupAddon addonType="append">
                        <Button color="primary" onClick={this.addFolder}><FontAwesomeIcon icon={faCheck} /></Button>
                        <Button color="danger" onClick={this.cancelAddFolder}><FontAwesomeIcon icon={faTimes} /></Button>
                      </InputGroupAddon>
                    </InputGroup>
                  </Col>
                </Row>
              }
              { addFile &&
                <Row>
                  <Col>
                    <InputGroup key="file">
                      <Label for="uploads" className="btn btn-primary">Choose Files</Label>
                      <Input hidden id="uploads" type="file" onChange={this.changeNewFile} required />
                      <InputGroupAddon addonType="append">
                        <Button color="primary" onClick={this.addFile}><FontAwesomeIcon icon={faCheck} /></Button>
                        <Button color="danger" onClick={this.cancelAddFile}><FontAwesomeIcon icon={faTimes} /></Button>
                      </InputGroupAddon>
                    </InputGroup>
                    { newFile.map(file => (
                      <Row key={file.name}>
                        <Col>{file.name}</Col>
                      </Row>
                      ))
                    }
                  </Col>
                </Row>
              }
              { (!addFile && !addFolder) &&
                <Row>
                  <Col>
                    <Button key="addfolder" color="success" onClick={this.addFolder}><FontAwesomeIcon icon={faPlusCircle} /> Add Folder</Button>
                    <Button key="uploadfile" color="success" onClick={this.addFile}><FontAwesomeIcon icon={faUpload} /> Upload File</Button>
                  </Col>
                </Row>
              }
            </div>
            <Row>
              <Col className="footerCallToAction">
                <Link className="btn btn-xl btn-secondary" to={`compute/${project.name}`} title="Launch this project in ecocloud Compute"><FontAwesomeIcon icon={faServer} />  Launch in <strong><em>Compute</em></strong></Link>
                <p>Need additional datasets? Find them in <Link to="explorer" title="Find datasets in ecocloud Explorer"><strong><em>Explorer</em></strong></Link></p>
              </Col>
            </Row>
          </ReduxBlockUi>
        }
      </Container>
    );
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(ProjectsController);
