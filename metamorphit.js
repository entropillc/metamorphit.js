;'use strict';

/**

*/
var Metamorphit = function Metamorphit(element) {
  if (!element) return;
  
  var $element = this.$element = $(element);
  element = this.element = $element[0];
  
  var metamorphit = element.metamorphit;
  if (metamorphit) return metamorphit;
  
  var self = element.metamorphit = this;
  
  var $style = this.$style = $('style[id^="mm-style-"]');
  if ($style.length === 0) $style = this.$style = $('<style id="mm-style-' + (new Date().getTime()) + '"/>').appendTo(document.head);
  
  this._transitions = [];
};

Metamorphit.prototype = {
  constructor: Metamorphit,
  
  element: null,
  $element: null,
  $style: null,
  
  _transitionDelayTimeout: null,
  
  _delaying: false,
  
  /**
  
  */
  getDelaying: function() { return this._delaying; },
  
  _transitioning: false,
  
  /**
  
  */
  getTransitioning: function() { return this._transitioning; },
  
  _currentTransitionIndex: -1,
  
  /**
  
  */
  getCurrentTransitionIndex: function() { return this._currentTransitionIndex; },
  
  /**
  
  */
  setCurrentTransitionIndex: function(currentTransitionIndex) {
    this._currentTransitionIndex = Math.min(Math.max(0, currentTransitionIndex), this.getNumberOfTransitions());
  },
  
  /**
  
  */
  getCurrentTransition: function() {
    var currentTransitionIndex = this.getCurrentTransitionIndex();
    var numberOfTransitions = this.getNumberOfTransitions();
    if (currentTransitionIndex < 0 || currentTransitionIndex >= numberOfTransitions) return null;
    
    return this.getTransitions()[currentTransitionIndex];
  },
  
  _transitions: null, // [ { ... }, ... ]
  
  /**
  
  */
  getTransitions: function() { return this._transitions; },
  
  /**
  
  */
  setTransitions: function(transitions) {
    this._transitions = transitions;
    
    var dynamicId = +new Date();
    
    var $element = this.$element;
    $element.removeClass('mm-initialized');
    
    var $transitionElement;
    for (var i = 0, length = transitions.length, transition; i < length; i++) {
      transition = transitions[i];
      
      if (transition.appendTo) {
        if (!($transitionElement = $(transition.element)).attr('id')) $transitionElement.attr('id', (transition.element = '#mm-target-' + (dynamicId++)).slice(1));
        
        $element.find(transition.appendTo).append($transitionElement);
      } else {
        $transitionElement = $element.find(transition.element);
      }
      
      $transitionElement.addClass('mm-target').addClass(transition.effect);
    }
    
    $element.addClass('mm-initialized');
    this.setCurrentTransitionIndex(-1);
  },
  
  /**
  
  */
  getNumberOfTransitions: function() { return this.getTransitions().length; },
  
  /**
  
  */
  hasTransitions: function() { return this.getNumberOfTransitions() > 0; },
  
  /**
  
  */
  flushAnimations: function() {
    var $style = this.$style, doNothing;
    
    $style.html('.mm-target.mm-active {' +
    '  -webkit-transition: none !important;' +
    '     -moz-transition: none !important;' +
    '      -ms-transition: none !important;' +
    '       -o-transition: none !important;' +
    '          transition: none !important;' +
    '}');
    doNothing = document.body.offsetHeight;
    
    $style.html('');
    doNothing = document.body.offsetHeight;
  },
  
  /**
  
  */
  start: function() {
    if (!this.hasTransitions()) return;
    
    this.setCurrentTransitionIndex(0);
    
    var self = this;
    
    window.setTimeout(function() {
      self._isStopped = false;
      self.next();
    }, 500);
  },

  /**

  */
  reset: function() {
    this._isStopped = true;
    // remove mm-active class from all child elements
    this.$element.find('.mm-active').removeClass('mm-active');
    this._transitioning = false;
    this._delaying = false;
  },
  
  /**
  
  */
  previous: function() {
    if (!this.hasTransitions() || this.getDelaying() || this.getTransitioning()) return;
    
    window.clearTimeout(this._transitionDelayTimeout);
    this._delaying = false;
    
    this.setCurrentTransitionIndex(this.getCurrentTransitionIndex() - 1);
    
    var transition = this.getCurrentTransition();
    if (!transition) return;
    
    var $transitionElement = this.$element.find(transition.element);
    $transitionElement.removeClass('mm-active');
  },
  
  /**
  
  */
  next: function() {
    if (!this.hasTransitions() || this.getDelaying() || this.getTransitioning()) return;
    
    if (this.getCurrentTransitionIndex() === -1) this.setCurrentTransitionIndex(0);
    
    var transition = this.getCurrentTransition();
    if (!transition) return;
    
    var self = this;
    
    var $transitionElement = this.$element.find(transition.element);
    
    var delay = transition.delay;
    if (delay) {
      this._delaying = true;
      this._transitionDelayTimeout = window.setTimeout(function() {
        if (self._isStopped) return;
        self._delaying = false;
        self._transitioning = true;
        
        $transitionElement.bind('webkitTransitionEnd transitionend MSTransitionEnd oTransitionEnd transitionEnd', function(evt) {
          $transitionElement.unbind(evt);
          
          self._transitioning = false;
          
          // Do nothing if the transition was cancelled and the .mm-active class was removed.
          if (!$transitionElement.hasClass('mm-active')) return;
          
          self.setCurrentTransitionIndex(self.getCurrentTransitionIndex() + 1);
          
          if (!transition.pause) self.next();
        });
        
        $transitionElement.addClass('mm-active');
      }, delay);
    } else {
      this._transitioning = true;
      
      $transitionElement.bind('webkitTransitionEnd transitionend MSTransitionEnd oTransitionEnd transitionEnd', function(evt) {
        $transitionElement.unbind(evt);
        
        self._transitioning = false;
        
        // Do nothing if the transition was cancelled and the .mm-active class was removed.
        if (!$transitionElement.hasClass('mm-active')) return;
        
        self.setCurrentTransitionIndex(self.getCurrentTransitionIndex() + 1);
        
        if (!transition.pause) self.next();
      });
      
      $transitionElement.addClass('mm-active');
    }
  }
};

$(function() { $('.mm-metamorphit').each(function(index, element) { new Metamorphit(element); }); });
