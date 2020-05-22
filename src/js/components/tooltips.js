// Tooltips
const select = require("../utils/select");
const behavior = require("../utils/behavior");
const { prefix: PREFIX } = require("../config");
const isElementInViewport = require("../utils/is-in-viewport");

const TOOLTIP_TRIGGER = `.${PREFIX}-tooltip__trigger`
const WRAPPER_CLASS = 'usa-tooltip-wrapper';
const TOOLTIP_CLASS = 'usa-tooltip';
const SET_CLASS = 'is-set';
const VISIBLE_CLASS = 'is-visible';
const TRIANGLE_SIZE = 5;
const SPACER = 2;
const ADJUST_WIDTH_CLASS = `${PREFIX}-tooltip--wrap`;

/** Add one or more listeners to an element
* @param {DOMElement} element - DOM element to add listeners to
* @param {string} eventNames - space separated list of event names, e.g. 'click change'
* @param {Function} listener - function to attach for each event as a listener
*/
const addListenerMulti = (element, eventNames, listener) => {
  const events = eventNames.split(' ');
  for (let i=0, iLen=events.length; i<iLen; i += 1) {
    element.addEventListener(events[i], listener, false);
  }
}

/** Creates the tooltip
* @param {HTMLElement} tooltipTrigger - the element that initializes the tooltip
*/
const createToolTip = tooltipTrigger => {
  const tooltipID = `tooltip-${Math.floor(Math.random()*900000) + 100000}`;
  const tooltipContent = tooltipTrigger.getAttribute("title");
  const wrapper = document.createElement('div');
  const tooltipBody = document.createElement('span');
  let position = tooltipTrigger.getAttribute("data-position") ? tooltipTrigger.getAttribute("data-position") : 'top';
  const originalPosition = position;

  // Set up tooltip attributes
  tooltipTrigger.setAttribute("aria-describedby", tooltipID);
  tooltipTrigger.setAttribute("tabindex", "0");
  tooltipTrigger.setAttribute("title", "");

  // insert wrapper before el in the DOM tree
  tooltipTrigger.parentNode.insertBefore(wrapper, tooltipTrigger);

  // set up the wrapper
  wrapper.appendChild(tooltipTrigger);
  wrapper.classList.add(WRAPPER_CLASS);
  wrapper.appendChild(tooltipBody);

  // set up the tooltip body
  tooltipBody.classList.add(TOOLTIP_CLASS);
  tooltipBody.setAttribute("id", tooltipID);
  tooltipBody.setAttribute("role", "tooltip");
  tooltipBody.setAttribute("aria-hidden", "true");

  // place the text in the tooltip
  tooltipBody.innerHTML = tooltipContent;

  const showToolTip = () => {
    // This sets up the tooltip body. The opacity is 0, but
    // we can begin running the calculations below.
    tooltipBody.classList.add(SET_CLASS);

    // Calculate sizing and adjustments for positioning
    const tooltipWidth = tooltipTrigger.offsetWidth;
    const tooltipHeight = tooltipTrigger.offsetHeight;
    const offsetForRightMargin = parseInt(window.getComputedStyle(tooltipTrigger).getPropertyValue("margin-right"), 10);
    const offsetForLeftMargin = parseInt(window.getComputedStyle(tooltipTrigger).getPropertyValue("margin-left"), 10);
    const offsetForTopMargin = parseInt(window.getComputedStyle(tooltipTrigger).getPropertyValue("margin-top"), 10);
    const offsetForBottomMargin = parseInt(window.getComputedStyle(tooltipTrigger).getPropertyValue("margin-bottom"), 10);
    const offsetForTooltipBodyHeight = parseInt(window.getComputedStyle(tooltipBody).getPropertyValue("height"), 10);
    const adjustHorizontalCenter = tooltipWidth / 2;
    const adjustToEdgeX = tooltipWidth + TRIANGLE_SIZE + SPACER;
    const adjustToEdgeY = tooltipHeight + TRIANGLE_SIZE + SPACER;

    /** Position the tooltip body when the trigger is hovered
    * Removes old positioning classnames and reapplies. This allows
    * positioning to change in case the user resizes browser or DOM manipulation
    * causes tooltip to get clipped from viewport
    *
    * @param {string} position - can be "top", "bottom", "right", "left"
    */
    const adjustToPosition = setPos => {
      tooltipTrigger.classList.remove(`${TOOLTIP_CLASS}--${position}`);
      position = setPos;
      tooltipTrigger.classList.add(`${TOOLTIP_CLASS}--${position}`);
    }

    /** Positions tooltip at the top
    * We check if the element is in theviewport so we know whether or not we
    * need to constrain the width
    *
    * @param {HTMLElement} tooltipTrigger body
    */
    const positionTop = e => {
      adjustToPosition("top");
      e.style.marginLeft = `${adjustHorizontalCenter}px`
      if (!isElementInViewport(e)) {
        e.classList.add(ADJUST_WIDTH_CLASS);
      }
      e.style.marginBottom = `${adjustToEdgeY + offsetForBottomMargin}px`;
    }

    /** Positions tooltip at the bottom
    * We check if the element is in theviewport so we know whether or not we
    * need to constrain the width
    *
    * @param {HTMLElement} tooltipTrigger body
    */
    const positionBottom = e => {
      adjustToPosition("bottom");
      e.style.marginLeft = `${adjustHorizontalCenter}px`
      if (!isElementInViewport(e)) {
        e.classList.add(ADJUST_WIDTH_CLASS);
      }
      e.style.marginTop = `${adjustToEdgeY + offsetForTopMargin}px`;
    }

    /** Positions tooltip at the right
    *
    * @param {HTMLElement} tooltipTrigger body
    */
    const positionRight = e => {
      adjustToPosition("right");
      e.style.marginLeft = `${adjustToEdgeX + offsetForLeftMargin}px`
      e.style.bottom = `${((tooltipHeight - offsetForTooltipBodyHeight) / 2) + offsetForBottomMargin}px`;
    }

    /** Positions tooltip at the right
    *
    * @param {HTMLElement} tooltipTrigger body
    */
    const positionLeft = e => {
      adjustToPosition("left");
      e.style.marginRight = `${adjustToEdgeX + offsetForRightMargin}px`;
      e.style.bottom = `${((tooltipHeight - offsetForTooltipBodyHeight) / 2) + offsetForBottomMargin}px`;
    }

    /** We try to set the position based on the
    * original intention, but make adjustments
    * if the element is clipped out of the viewport
    */
    switch(position) {
      case "top":
        positionTop(tooltipBody);
        if (!isElementInViewport(tooltipBody)) {
          positionBottom(tooltipBody);
        }
        break;
      case "bottom":
        positionBottom(tooltipBody);
        if (!isElementInViewport(tooltipBody)) {
          positionTop(tooltipBody);
        }
        break;
      case "right":
        positionRight(tooltipBody);
        if (!isElementInViewport(tooltipBody)) {
          positionLeft(tooltipBody);
          if (!isElementInViewport(tooltipBody)) {
            positionTop(tooltipBody);
          }
        }
        break;
      case "left":
        positionLeft(tooltipBody);
        if (!isElementInViewport(tooltipBody)) {
          positionRight(tooltipBody);
          if (!isElementInViewport(tooltipBody)) {
            positionTop(tooltipBody);
          }
        }
        break;

      default:
        // skip default case
        break;
    }

    /**
    * Actually show the tooltip. The VISIBLE_CLASS
    * will change the opacity to 1
    */
    setTimeout(function makeVisible(){
      tooltipBody.classList.add(VISIBLE_CLASS);
    }, 20);
  };

  /** Removes all the properties to show and position the tooltip,
  * and resets the tooltip position to the original intention
  * in case the window is resized or the element is moved through
  * DOM maniulation.
  */
  const hideToolTip = () => {
    tooltipBody.classList.remove(VISIBLE_CLASS);
    tooltipBody.classList.remove(SET_CLASS);
    tooltipBody.classList.remove(ADJUST_WIDTH_CLASS);
    tooltipTrigger.classList.remove(`${TOOLTIP_CLASS}--${position}`);
    position = originalPosition;
  };

  // Listeners for showing and hiding the tooltip
  addListenerMulti(tooltipTrigger, 'mouseenter focus', function handleShow(){
    showToolTip();
    return false;
  });

  addListenerMulti(tooltipTrigger, 'mouseleave blur', function handleHide(){
    hideToolTip();
    return false;
  });

}

// Setup our function to run on various events
const tooltips = behavior(
  {
  },
  {
    init(root) {
      select(TOOLTIP_TRIGGER, root).forEach(tooltipTrigger => {
        createToolTip(tooltipTrigger);
      });
    }
  }
);

module.exports = tooltips;
