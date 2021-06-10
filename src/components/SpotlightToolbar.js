import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import hash from "object-hash";

import { setActiveSpotlight } from "../actions";
import * as selectors from "../selectors/index";
import { getUniqueSpotlights } from "../common/utilities";

import Handles from "./atoms/Handles";

class SpotlightToolbar extends React.Component {
  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
    this.state = {
      maxInView: 4,
      startIdx: 0,
      endIdx: 0,
      xPositions: [],
      spotlights: props.spotlights,
      dimensions: props.dimensions,
    };
  }

  componentDidMount() {
    window.addEventListener("resize", () => {
      this.computeDims();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (hash(prevProps.spotlights) !== hash(this.props.spotlights)) {
      const uniqueSpotlights = getUniqueSpotlights(this.props.spotlights);
      this.setState({
        spotlights: uniqueSpotlights,
        xPositions: this.computeInitialXPositions(uniqueSpotlights),
      });
    }
  }

  onMoveSpotlight(direction) {
    let {
      xPositions: xPositionsToUpdate,
      startIdx: start,
      endIdx: end,
      maxInView,
      spotlights,
    } = this.state;
    const totalSpotlightLength = spotlights.length;
    const buttonWidth = this.computeButtonWidth();

    if (direction === "forward") {
      if (
        end < totalSpotlightLength - 1 &&
        start < totalSpotlightLength - maxInView
      ) {
        end += 1;
        start += 1;
        xPositionsToUpdate = xPositionsToUpdate.map((pos) => pos - buttonWidth);
      }
    }

    if (direction === "backwards") {
      if (start > 0) {
        start -= 1;
        end -= 1;
        xPositionsToUpdate = xPositionsToUpdate.map((pos) => pos + buttonWidth);
      }
    }

    this.setState({
      startIdx: start,
      endIdx: end,
      xPositions: xPositionsToUpdate,
    });
  }

  computeInitialXPositions(spotlights) {
    const { dimensions: dims } = this.state;
    const buttonWidth = this.computeButtonWidth();
    return spotlights.reduce((acc, _, idx) => {
      acc.push(dims.marginLeft + idx * buttonWidth);
      return acc;
    }, []);
  }

  computeDims() {
    const dom = this.props.dom.spotlightToolbar;
    if (document.querySelector(`#${dom}`) !== null) {
      const boundingClient = document
        .querySelector(`#${dom}`)
        .getBoundingClientRect();

      this.setState({
        dimensions: {
          ...this.props.dimensions,
          width: boundingClient.width,
          height: boundingClient.height,
        },
      });
    }
  }

  computeContentDims() {
    const { dimensions: dims } = this.state;
    return {
      contentHeight: dims.height - dims.marginLeft - 30,
      contentWidth: dims.width - dims.marginLeft - dims.width_controls,
    };
  }

  computeButtonWidth() {
    const contentDims = this.computeContentDims();
    return contentDims.contentWidth / this.state.maxInView;
  }

  onSpotlightSelect(title) {
    const { activeSpotlight, actions } = this.props;
    const toggle = activeSpotlight !== title ? title : "";
    actions.setActiveSpotlight(toggle);
  }

  renderSpotlightButtons() {
    const buttonWidth = this.computeButtonWidth();
    const contentDims = this.computeContentDims();
    const { xPositions } = this.state;

    return (
      <g className="spotlight-group">
        {this.state.spotlights.map((sp, idx) => {
          const { title } = sp;
          const xPos = xPositions[idx];
          const classes = `spotlight-button ${
            this.props.activeSpotlight === title ? " active" : ""
          }`;
          return (
            <g
              clipPath="url(#spotlight-clip)"
              className={classes}
              onClick={() => this.onSpotlightSelect(title)}
            >
              <rect
                transform={`translate(${xPos}, 0)`}
                width={buttonWidth}
                height={contentDims.contentHeight}
              />
              <text
                transform={`translate(${xPos + buttonWidth / 2}, ${
                  contentDims.contentHeight / 2
                })`}
              >
                {title}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  render() {
    const { dimensions } = this.state;
    const heightStyle = { height: dimensions.height };

    const contentDims = this.computeContentDims();
    const { contentHeight, contentWidth } = contentDims;

    const contentStyles = {
      width: dimensions.width,
      height: contentHeight,
      margin: dimensions.marginLeft,
    };

    return (
      <div className="spotlight-wrapper" style={heightStyle}>
        <div
          id={this.props.dom.spotlightToolbar}
          className="spotlight-toolbar"
          style={heightStyle}
        >
          <svg ref={this.svgRef} style={contentStyles}>
            <clipPath id="spotlight-clip">
              <rect
                x={dimensions.marginLeft}
                y="0"
                width={contentWidth}
                height={contentHeight}
              />
            </clipPath>
            {this.renderSpotlightButtons()}
            <Handles
              classes="time-controls-inline"
              dims={{
                ...dimensions,
                contentHeight: contentHeight,
                heightDiffControls: contentHeight / 2,
              }}
              onMove={(dir) => {
                this.onMoveSpotlight(dir);
              }}
            />
          </svg>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    dimensions: state.app.spotlightToolbar.dimensions,
    dom: state.ui.dom,
    spotlights: selectors.getSpotlights(state),
    activeSpotlight: selectors.getActiveSpotlight(state),
    features: selectors.getFeatures(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ setActiveSpotlight }, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SpotlightToolbar);