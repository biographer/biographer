function goToByScroll(elem){
    //http://djpate.com/2009/10/07/animated-scroll-to-anchorid-function-with-jquery/
    $('html,body').animate({scrollTop: $(elem).offset().top},'fast');
}
$('#new_issue_button').click(function(){
        web2py_component('{{=URL(request.application, 'plugin_issue', 'edit.load')}}','edit_issue');
        $('#edit_issue').show();
        });
$('#close_edit').click(function(){
        $('#edit_issue').hide();
        });
function init_issues(){
    $('.issue_summary').click(function(){
        var issue_id = $(this).attr('id');
        if ($('#edit_issue'+issue_id).length != 0){
            $('#edit_issue'+issue_id).slideToggle()();
        }else{
            var elem = this
            $.ajax({'type':'get','url': '{{=URL(request.application, 'plugin_issue', 'issue.load')}}/'+issue_id,
                'beforeSend':function() { $(elem).after('<div id="edit_issue'+issue_id+'" class="edit_issue" ></div>'); },
                'complete':function(xhr,text){
                    $('#edit_issue'+issue_id).html(xhr.responseText);
                    $('#edit_issue'+issue_id).slideDown();
                    //goToByScroll(elem);
                },
            });
        }
    });
    $('.del').click(function(e){
        e.stopPropagation();
        var issue_id = $(this).parent().attr('id');
        var this_elem = this;
        $.ajax({
            type: 'GET',
            url: '{{=URL('issue')}}',
            data: { 'delete': issue_id },
            complete: function(xhr, text){
                $(this_elem).parent().hide();
                $('.flash').html(xhr.responseText);
                $('.flash').slideDown().delay(1000).slideUp();
            },
            error: function(xhr, textStatus, errorThrown) {
              jQuery('.flash').html(textStatus+' '+xhr.responseText).slideDown();//.delay(500).slideUp();
            }

        });
    });
}
function init_add_remove_error(){
    $('.remove_error').click(function(){
        $(this).parent().removeClass('attached');
        $(this).attr('class','add_error action');
        $(this).html('{{=IMG(_src=URL(request.application, 'static/plugin_issue', 'add.png'), _alt='add ticket')}}');
        init_add_remove_error();
    });
    $('.add_error').click(function(){
        var error_record_id = $(this).attr('id');
        if ($('input[name=error][value='+error_record_id+']').length == 0) {
            if(!$(this).parent().parent().parent().hasClass('attached_errors')) $(this).parent().addClass('attached');
            $(this).attr('class','remove_error action');
            $(this).html('{{=IMG(_src=URL(request.application, 'static/plugin_issue', 'cancel.png'), _alt='remove ticket')}}<input type="hidden" name="error" value="'+error_record_id+'" />');
            $(this).attr('hooked_up', '1');
            init_add_remove_error();
        }//else{alert('know this one already');}
    });
}
function init_errors(){
    init_add_remove_error();
    $('.error_header .count, .error_header .origin, .error_header .summary').click(function(){ $(this).parent().next().slideToggle() });
}

function init_edit(){
{{if auth.is_logged_in():}}
    $('.list').change(function(){
        if ( ($(this).attr('id') == 'no_table_type') && ($(this).val().indexOf("bug") != -1)){
            var issue_id = $(this).parent().attr('id'); 
            if (!$('#errors'+issue_id).is(':empty')){
                $('#errors'+issue_id).show();
            } else {
                $('#errors'+issue_id).show();
                jQuery.ajax({'type':'get','url':'{{=URL(request.application, 'plugin_issue', 'errors', args=request.args)}}',
                    'beforeSend':function() {
                            $('#errors'+issue_id).html('{{=IMG(_src=URL(request.application, 'static/img', 'loading.gif'), _alt="... loading error tickets")}}');
                        },
                        'complete':function(xhr,text){
                            $('#errors'+issue_id).html(xhr.responseText);
                        },
                    });
                }
        }else{
            $('#errors'+issue_id).hide();
        }
    });
{{pass}}
}
function init_comment(edit_issue_id){
    var editbox_with = '780';
    if(edit_issue_id == 'edit_issue_None') editbox_with = '500';
    $('#'+edit_issue_id+' textarea').css('width',editbox_with+'px').css('height','70px').markItUp(mySettings);
{{if auth.is_logged_in():}}
    $('#comment_attachment_more').click(function(){
        var cur_id = parseInt( $(this).parent().attr('id'));
        cur_id += 1;
        $(this).parent().append('<div><input name="attachment'+cur_id+'" type="file"/></div>')
        $(this).parent().attr('id', cur_id);
    });
{{pass}}
}

function init_issue(){
    $('.edit').click(function(){ 
            var issue_id = $(this).attr('id');
            //goToByScroll(this);
            web2py_component('{{=URL(request.application, 'plugin_issue', 'edit.load')}}/'+issue_id,'edit_issue'+issue_id); 
            });
    $('.error_header .count, .error_header .origin, .error_header .summary').click(function(){
            $(this).parent().next().slideToggle()
            });
    $('#vote_up, #vote_down').click(function(){
            if( $(this).hasClass('cant_vote') ) return False;
            var vote = 'up';
            if ($(this).attr('id') == 'vote_down') vote = 'down';
            var issue_id = $(this).parent().attr('id')
            var elem = $(this).parent()
            jQuery.getJSON(
                '{{=URL(request.application, 'plugin_issue', 'vote.json')}}/'+issue_id,
                {'vote': vote},
                function(data){
                    $('.global_score').html(data.global_score);
                    var up_score = 0;
                    var down_score = 0;
                    if (data.user_score>0) up_score = data.user_score;
                    else if (data.user_score<0) down_score = data.user_score;
                    $('#vote_up',elem).attr('class', 'v_'+String(up_score));
                    $('#vote_down',elem).attr('class', 'v_'+String(down_score));
                }
            );
    });
}
