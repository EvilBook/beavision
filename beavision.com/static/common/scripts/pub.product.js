if(!pub)
	var pub = {};

pub.msgShow = function(msg, options) {
	options = options || {button: {label: 'OK', action: pub.msgHide}};
	if($('#gmbStdHover').length == 0 && $('#gmbStdMsg').length == 0) {
		var htmlStr = '<div id="gmbStdHover" class="gmbStdHover"></div><div id="gmbStdMsg" class="gmbStdMsg"><div id="gmbStdMsgContent" class="gmbStdMsgContent"></div>';
		for(key in options) {
			if(key.indexOf('button') === 0) {
				var btnOptions = options[key];
				htmlStr += '<button id="gmbStdMsg'+key+'" class="gmbStdMsgClose gmb-'+key+'" type="button">'+btnOptions.label+'</button>';
			}
		}
		htmlStr += '</div>';
		$('body').append(htmlStr);
	}
	$('#gmbStdMsgContent').html(msg);
	$('#gmbStdHover').show();
	$('#gmbStdMsg').fadeIn();
	$('#gmbStdHover').click(function() {
		pub.msgHide();
	});
	for(key in options) {
		if(key.indexOf('button') === 0)
			$('#gmbStdMsg' + key).click(options[key].action);
	}
};

pub.msgHide = function() {
	$('#gmbStdHover, #gmbStdMsg').fadeOut();
};

pub.product = {};
pub.product.variant = {paramEls: null, variant: {}, mainForm: '', changeUrl: false, lang: {}};

pub.product.variant.lang['notAvailableForSelectedOptions']	= ' (не наличен за избраните опции)';
pub.product.variant.lang['selectProductOptions'] 			= 'Моля, изберете от възможните опции преди да добавите продукта в количката.';
pub.product.variant.lang['selectedVariantNotInStock']		= 'Избраният вариант не е наличен в момента.';
pub.product.variant.lang['selectedProductNotInStock']		= 'Избраният продукт не е наличен в момента.';

pub.product.variant.optionStatus = function(sel, status) {
	var lang = pub.product.variant.lang;
	if(status === 'on') {
		// sel.attr('disabled', false);
		sel.prop('disabled', false);
		if(sel.attr('data-org-label'))
			sel.html(sel.attr('data-org-label'));
	} else {
		sel.prop('disabled', true).html(sel.attr('data-org-label') + lang.notAvailableForSelectedOptions);
	}
};

pub.product.setOutOfStockMode = function(mode, errMsg) {
	errMsg = errMsg || pub.product.variant.lang['selectedVariantNotInStock'];
	if(mode === true) {
		$('#addToCartBtn, .quantity, [data-var-qtty-cont]').fadeOut(function() {
				if($('#gmbStdNotInStockMsg').length == 0)
					$('#addToCartBtn').after('<div id="gmbStdNotInStockMsg" class="gmbStdNotInStockMsg">'+errMsg+'</div>');
				else
					$('#gmbStdNotInStockMsg').html(errMsg).fadeIn();
		});
	} else {
		$('#gmbStdNotInStockMsg').hide();
		$('#addToCartBtn, .quantity, [data-var-qtty-cont]').fadeIn();
	}
}

pub.product.variant.selected = function(variant) {
	var mainForm = pub.product.variant.mainForm;
	if(variant === false) {
		if(pub.product.variant.changeUrl && document.location.hash) {
			pub.product.variant.setUrlHash(0);
			// document.location.hash = 'variant=0';
		}
		$('#'+mainForm+' input[name="variantId"]').val('0');
		if($('[data-var-price]').attr('data-org-value'))
			$('[data-var-price]').html($('[data-var-price]').attr('data-org-value'));
		if($('[data-old-price]').attr('data-org-value'))
			$('[data-old-price]').html($('[data-old-price]').attr('data-org-value'));
		if($('[data-code]').attr('data-org-value'))
			$('[data-code]').html($('[data-code]').attr('data-org-value'));
		$('.data-product_thumbs li').first().children('a').click();
		$(document).trigger('variant:unselected');
	} else {
		if(pub.product.variant.changeUrl) {
			pub.product.variant.setUrlHash(variant.Id);
			// document.location.hash = 'variant=' + variant.Id;
		}
		for(index in variant.map)
			 $('#'+mainForm+' [name="params['+index+']"]').val(variant.map[index]);
		if($('#'+mainForm+' input[name="variantId"]').length)
			$('#'+mainForm+' input[name="variantId"]').val(variant.Id);
		else
			$('#'+mainForm+'').append('<input type="hidden" name="variantId" value="'+variant.Id+'" />');

		pub.product.setOutOfStockMode(variant.inStock == false);

		if(parseFloat(variant.price) > 0.01) {
			if(!$('[data-var-price]').attr('data-org-value'))
				$('[data-var-price]').attr('data-org-value', $('[data-var-price]').html());
			$('[data-var-price]').html(variant.priceF);
		}
		if(parseFloat(variant.orgPrice) > parseFloat(variant.price)) {
			if(!$('[data-old-price]').attr('data-org-value'))
				$('[data-old-price]').attr('data-org-value', $('[data-old-price]').html());
			$('[data-old-price]').html(variant.orgPriceF).fadeIn();
		} else if(parseFloat($('[data-old-price]').html()) <= parseFloat(variant.price))
			$('[data-old-price]').fadeOut();
		else
			$('[data-old-price]').fadeIn();

		if(variant.code) {
			if(!$('[data-code]').attr('data-org-value'))
				$('[data-code]').attr('data-org-value', $('[data-code]').html());
			$('[data-code]').html(variant.code);
		}
		if(variant.imageId)
			setTimeout(function() {
				$('#tmbPic' + variant.imageId).click();
			}, 100);
			
		$(document).trigger('variant:selected', variant);
	}
	
};

pub.product.variant.findAvailableOptions = function(excludeParam) {
		var excludeParam = excludeParam || 0;
		var existingOptions = {};

		var selectedOptions = {};
		var matchVariant = function(variantMap, selectedOptions) {
			var hasMatch = true;
			for(i in selectedOptions)
				if(selectedOptions[i] !== variantMap[i])
					hasMatch = false;
			return hasMatch;
		};
		pub.product.variant.paramEls.each(function() {
			if($(this).val() && ($(this).attr('data-param-id') != excludeParam))
				selectedOptions[$(this).attr('data-param-id')] = $(this).val();
		});

		var variants = pub.product.variant.list;
		var map = {};
		for(index in variants) {
			map = variants[index].map;
			if(matchVariant(map, selectedOptions)) {
				for(eParam in map) {
					if(!existingOptions[eParam])
						existingOptions[eParam] = [];
					if(existingOptions[eParam].indexOf(map[eParam]) == -1)
						existingOptions[eParam].push(map[eParam]);
				}
			}
		}

		if($.isEmptyObject(existingOptions)) {
			pub.product.variant.optionStatus(pub.product.variant.paramEls.children('option'), 'on');
		} else {
			pub.product.variant.paramEls.each(function() {
				var curParam = $(this).attr('data-param-id');
				$(this).children('option').each(function() {
					if($(this).val() && existingOptions[curParam] && (existingOptions[curParam].indexOf($(this).val()) == -1))
						pub.product.variant.optionStatus($(this), 'off');
					else
						pub.product.variant.optionStatus($(this), 'on');
				});
			});
		}

};

pub.product.variant.checkIfVariantSelected = function() {
	var variants = pub.product.variant.list;
	var selOptions = {};
	var selectionReady = true;
	pub.product.variant.paramEls.each(function() {
		if(!$(this).val()) {
			selectionReady = false;
			return;
		}
		selOptions[$(this).attr('data-param-id')] = $(this).val();
	});

	if(selectionReady) {
		for(index in variants) {
			if(JSON.stringify(variants[index].map) == JSON.stringify(selOptions)) {
				pub.product.variant.selected(variants[index]);
				return;
			}
		}
	}
	pub.product.variant.selected(false);
}

pub.product.variant.pareseUrl = function() {
	if(document.location.hash) {
		var matched = document.location.hash.match(/variant=(\d+)/);
		if(matched && (parseInt(matched[1]) > 0) && pub.product.variant.list.hasOwnProperty(parseInt(matched[1]))) {
			pub.product.variant.selected(pub.product.variant.list[parseInt(matched[1])]);
		}
	}
	
};

pub.product.variant.setUrlHash = function(variantId) {
	var urlParser = document.createElement('a');
	urlParser.href = document.location;
	urlParser.hash = 'variant=' + variantId;
	document.location.replace(urlParser.href);	
};

pub.product.variant.addToCart = function(okCallback, errorCallback) {
	var okCallbackWrap = function() {
		okCallback();
		pub.product.variant.paramEls.removeClass('error');
		var productId = $('#' + pub.product.variant.mainForm).find('[name="Id"]').val();
		$(document).trigger({type: 'product:addToCart', productId: productId, contentType: 'product'});
	};
	var errorCallback = (typeof errorCallback === 'function') ? errorCallback : function(errorsList) {
		for(var index in errorsList)
			$('[data-param-id="'+errorsList[index].paramId+'"]').addClass('error');
		var errorMsgCont = $('#addToCartValidationMsg');
		if(errorMsgCont.length) {
			errorMsgCont.html(pub.product.variant.lang['selectProductOptions']).show();
			setTimeout(function() {
				errorMsgCont.fadeOut().html('');
			}, 3000);
		} else
			pub.msgShow(pub.product.variant.lang['selectProductOptions']);
	};

	// if(pub.product.variant.paramEls.length == 0)
	// 	okCallbackWrap();
	var errors = [];
	pub.product.variant.paramEls.each(function() {
		if(!$(this).val())
			errors.push({paramId: $(this).attr('data-param-id'), paramName: $(this).attr('data-field-label')});
	});
	if(errors.length == 0)
		okCallbackWrap();
	else
		errorCallback(errors);
}

pub.product.variant.setLangs = function(data) {
	if(typeof data !== 'object' || data === null)
		return;
	for (var key in pub.product.variant.lang) {
		if(pub.product.variant.lang.hasOwnProperty(key) && data.hasOwnProperty(key))
        	pub.product.variant.lang[key] = data[key] || pub.product.variant.lang[key];
	}
};

pub.product.variant.init = function(variants, mainForm, mainPrdInStock, changeUrl) {
	var variants = $.parseJSON(variants);
	pub.product.variant.list = variants;
	pub.product.variant.paramEls = $('#'+mainForm+' [name^="params["][data-variant]');
	pub.product.variant.changeUrl = changeUrl || true;
	pub.product.variant.mainForm = mainForm;
	
	if(pub.product.variant.paramEls.length > 0) {
		pub.product.variant.paramEls.each(function() { $(this).attr('data-param-id', String(parseInt($(this).attr('name').replace('params[', '')))); });
		pub.product.variant.paramEls.children('option').each(function() { $(this).attr('data-org-label', $(this).html()); });
		pub.product.variant.paramEls.focus(function() {
			pub.product.variant.findAvailableOptions($(this).attr('data-param-id'));
		});
        pub.product.variant.paramEls.bind('touchstart',function() {
            pub.product.variant.findAvailableOptions($(this).attr('data-param-id'));
        });
		pub.product.variant.paramEls.change(pub.product.variant.checkIfVariantSelected);
		pub.product.variant.pareseUrl();
		pub.product.variant.paramEls.first().change();
	} else {
		pub.product.setOutOfStockMode(mainPrdInStock == false, pub.product.variant.lang['selectedProductNotInStock']);
	}
};