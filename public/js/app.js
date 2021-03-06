/**
 * App global variable
 * @type {{userSession: null}}
 */
var appGlobal = {
  userSession : null
};

/**
 * App starter
 */
$(document).ready(function() {

    updateUserSession();

    if($("#logoutBtn").length > 0) {

        //we are in dashboard so let's do security filtering
        if(appGlobal.userSession == null) {
            document.location = "/login";
        }

        //logout button event
        $("#logoutBtn").click(function() {
            localStorage.clear();
            document.location = "/";
        });
    }
});

/**
 * User session updater
 */
function updateUserSession() {

    if(localStorage.getItem("user") != null) {

        try {
            var user = JSON.parse(localStorage.getItem("user"));

            if(user && $("#username_menu").length > 0) {
                user = user;
                appGlobal.userSession = user;

                $("#username_menu").html(user.username);
            }
        }
        catch(e) {}

    }
}

/**
 * The signup Form class
 * @constructor
 */
function SettingsProfileForm() {

    this.dropzoneId = "profilePicDropper";
    this.uploadPath = "/uploads";
    this.SockrageUser;

    this.init = function(sockrageAddr, reference) {

        $("#inputUsername").val(appGlobal.userSession.username);
        $("#inputEmail").val(appGlobal.userSession.email);
        $("#inputProfilePicture").val(appGlobal.userSession.profilePicture);

        $("#" + SettingsProfileForm.dropzoneId).html('<img src="' + appGlobal.userSession.profilePicture + '">');

        this.SockrageUser = new SockRage(sockrageAddr, reference);
        this.SockrageUser.on("update", function(data) {
            toastr.success("Profile updated !");
        });

        initDropzone(
            this.uploadFinished,
            this.dragStart,
            this.dragOver,
            this.dragEnd,
            this.dragEnd,
            this.drop,
            this.totalUploadProgress,
            null,
            this.dropzoneId
        );

        $("#updatePasswordButton").click(function() {
            SettingsProfileForm.updatePassword();
        });

        $("#updateProfileButton").click(function() {
            SettingsProfileForm.updateProfile();
        });

        $("#resetDropzone").click(function() {
            SettingsProfileForm.resetDropzone();
        });
    }

    this.resetDropzone = function() {

        $("#inputProfilePicture").val("");
        $("#" + SettingsProfileForm.dropzoneId).html("");

    }

    this.uploadFinished = function(file, response) {

        if(response.file) {

            $("#uploadLoader").hide();

            $("#" + SettingsProfileForm.dropzoneId).html('<img src="' + encodeURI(SettingsProfileForm.uploadPath + "/" + response.file.name) + '">');
            $(".dropper").css("border", "1px solid dodgerblue");
            $("#inputProfilePicture").val(SettingsProfileForm.uploadPath + "/" + response.file.name);

        }

    }

    this.dragStart = function() {
        $("#uploadLoader").show();
    }

    this.dragOver = function() {
        $(".dropper").css("border", "5px dotted red");
    }

    this.dragEnd = function() {
        $(".dropper").css("border", "5px dotted dodgerblue");
    }

    this.drop = function() {
        $(".dropper").css("border", "5px dotted dodgerblue");
    }

    this.totalUploadProgress = function(progress, totalBytes, totalBytesSent) {}

    this.updateProfile = function() {

        if($("#inputUsername").val().length == 0) {
            toastr.error("Please enter your username");
        }
        else if($("#inputEmail").val().length == 0) {
            toastr.error("Please enter your password");
        }
        else if($("#inputProfilePicture").val().length == 0) {
            toastr.error("Please upload a profile picture");
        }
        else {
            var newUser = {
                password : appGlobal.userSession.password,
                username : $("#inputUsername").val(),
                email : $("#inputEmail").val(),
                profilePicture : $("#inputProfilePicture").val()
            };

            SettingsProfileForm.SockrageUser.update(appGlobal.userSession._id, newUser);

            newUser._id = appGlobal.userSession._id;
            localStorage.setItem("user", JSON.stringify(newUser));

            updateUserSession();
        }
    }

    this.updatePassword = function() {

        if($("#inputPassword").val().length == 0) {
            toastr.error("Please enter your password");
        }
        else if($("#inputPassword").val() != $("#inputPasswordConfirmation").val() != 0) {
            toastr.error("Passwords don't match !");
        }
        else if($("#inputCurrentPassword").val() != appGlobal.userSession.password) {
            toastr.error("Your current password is incorrect");
        }
        else {
            var newUser = {
                password : $("#inputPassword").val(),
                username : appGlobal.userSession.username,
                email : appGlobal.userSession.email,
                profilePicture : appGlobal.userSession.profilePicture
            };

            SettingsProfileForm.SockrageUser.update(appGlobal.userSession._id, newUser);

            newUser._id = appGlobal.userSession._id;
            localStorage.setItem("user", JSON.stringify(newUser));

            updateUserSession();
        }
    }
}

/**
 * The Room
 * @constructor
 */
function Room() {

    this.roomName;
    this.SockrageRoom;

    this.init = function(sockrageAddr, referenceRoom) {

        this.SockrageRoom = new SockRage(sockrageAddr, referenceRoom);

        this.SockrageRoom.on("getById", function(room) {

            if(room.name == null) {
                document.location = "/";
            }
            else {
                $("#room_name").html(room.name);
            }

        });

        this.roomName = $("#room_id").val();
        this.SockrageRoom.get(this.roomName);

        var webRtc = new SimpleWebRTC({
            localVideoEl: 'localVideo',
            remoteVideosEl: 'remotesVideos',
            autoRequestMedia: true
        });

        webRtc.on('readyToCall', function() {
            webRtc.joinRoom(Room.roomName);
        });

    }

}

/**
 * Rooms list
 * @constructor
 */
function RoomTable() {

    this.SockrageRoom;

    this.init = function(sockrageAddr, reference, filter) {

        this.SockrageRoom = new SockRage(sockrageAddr, reference);

        this.SockrageRoom.on("getAll", function(rooms) {

            RoomTable.listRooms(rooms, filter);
        });

        this.SockrageRoom.on("delete", function(data) {

            toastr.success("Room deleted !");

        });

        this.SockrageRoom.list();

    }

    this.removeRoom = function(room_id) {

        smoke.confirm("Are you sure ?", function(e) {
            if (e){
                RoomTable.SockrageRoom.delete(room_id);
                $("#" + room_id).hide();
            }else{}
        }, {
            ok: "Yep",
            cancel: "Nope",
            reverseButtons: true
        });

    }

    this.listRooms = function(rooms, filter) {

        var html = "<table class='table table-striped'>";
        html += "<thead>";
        html += "<td>Room's name</td><td>Room's description</td><td>Room's owner</td><td>Settings</td>";
        html += "</thead>";

        html += "<tbody>";

        if(filter == "my") {
            rooms = jsonsql.query(
            "SELECT * FROM json WHERE (author == '" + appGlobal.userSession.username + "')",
            rooms);
        }

        for(var i = 0; i < rooms.length; i++) {

            var room = rooms[i];

            html += "<tr id='" + room._id + "'>"
                html += "<td>" + room.name + "</td>";
                html += "<td>" + room.description + "</td>";
                html += "<td>" + room.author + "</td>";
                html += "<td>";
                    html += "<a href='/room/" + room._id + "'><i class='fa fa-arrow-right'></i></a> ";
                    if(room.author == appGlobal.userSession.username) {
                        html += "<a href='#' onclick='RoomTable.removeRoom(\""+room._id+"\");'><i class='fa fa-trash'></i></a>";
                    }
            html += "</td>"
            html += "</tr>";
        }

        html += "</tbody>";
        html += "</table>";

        $("#rooms_table").html(html);
    }
}

/**
 * The create room form
 * @constructor
 */
function CreateRoomForm() {

    this.SockrageRoom;
    this.user;

    this.init = function(sockrageAddr, reference) {

        var userSession = JSON.parse(localStorage.getItem("user"));
        this.user = userSession;

        this.SockrageRoom = new SockRage(sockrageAddr, reference);

        $("#submitCreateRoom").click(function() {
           CreateRoomForm.createRoom();
        });
        $("#inputName").keypress(function(e) {
            if(e.which == 13) {
                CreateRoomForm.createRoom();
            }
        });
        $("#inputDescription").keypress(function(e) {
            if(e.which == 13) {
                CreateRoomForm.createRoom();
            }
        });
    }

    this.createRoom = function() {

        if($("#inputName").val().length == 0) {

            toastr.error("Please enter a room name");
        }
        else if($("#inputDescription").val().length == 0) {

            toastr.error("Please enter a room description");
        }
        else {

            CreateRoomForm.SockrageRoom.set({
                name : $("#inputName").val(),
                description : $("#inputDescription").val(),
                author : CreateRoomForm.user.username
            });

            document.location = "/dashboard";

        }

    }

}

/**
 * The login form class
 * @constructor
 */
function LoginForm() {

    this.SockrageUser;

    this.init = function(sockrageAddr, reference) {

        this.SockrageUser = new SockRage(sockrageAddr, reference);
        this.SockrageUser.on("getAll", function(data) {

            var password = $("#inputPassword").val();
            var email = $("#inputEmail").val();

            var user = jsonsql.query(
                "SELECT * FROM json WHERE (password == '" + password + "' && email == '" + email + "')",
                data);

            if(user.length == 1) {
                //connection OK

                localStorage.setItem("user", JSON.stringify(user[0])); //store in session
                document.location = "/dashboard";
            }
            else {
                toastr.error("Authentication failed.");
            }

        });

        $("#submitLoginButton").click(function() {
            LoginForm.login();
        });

        $("#inputEmail").keypress(function(e) {
            if(e.which == 13) {
                LoginForm.login();
            }
        });

        $("#inputPassword").keypress(function(e) {
            if(e.which == 13) {
                LoginForm.login();
            }
        });

    }

    this.login = function() {

        var password = $("#inputPassword").val();
        var email = $("#inputEmail").val();

        if(email.length > 0 && password.length > 0) {
            this.SockrageUser.list();
        }

    }
}

/**
 * The signup Form class
 * @constructor
 */
function SignupForm() {

    this.dropzoneId = "profilePicDropper";
    this.uploadPath = "/uploads";
    this.SockrageUser;

    this.init = function(sockrageAddr, reference) {

        this.SockrageUser = new SockRage(sockrageAddr, reference);
        this.SockrageUser.on("create", function(data) {
            document.location = "/login";
        });
        this.SockrageUser.on("getAll", function(users) {

            users = jsonsql.query(
                "SELECT * FROM json WHERE (email == '" + $("#inputEmail").val() + "' || username == '" + $("#inputUsername").val() + "')",
                users);

            if(users.length == 0) {
                SignupForm.SockrageUser.set({
                    username : $("#inputUsername").val(),
                    email : $("#inputEmail").val(),
                    password : $("#inputPassword").val(),
                    profilePicture : $("#inputProfilePicture").val()
                });
            }
            else {
                toastr.error("Email or Username already exists");
            }
        });

        initDropzone(
            this.uploadFinished,
            this.dragStart,
            this.dragOver,
            this.dragEnd,
            this.dragEnd,
            this.drop,
            this.totalUploadProgress,
            null,
            this.dropzoneId
        );

        $("#resetDropzone").click(function() {
            SignupForm.resetDropzone();
        });

        $("#submitUserButton").click(function() {
            SignupForm.submitForm();
        });
        $("#inputEmail").keypress(function(e) {
            if(e.which == 13) {
                SignupForm.submitForm();
            }
        });
        $("#inputPassword").keypress(function(e) {
            if(e.which == 13) {
                SignupForm.submitForm();
            }
        });
        $("#inputUsername").keypress(function(e) {
            if(e.which == 13) {
                SignupForm.submitForm();
            }
        });

    }

    this.resetDropzone = function() {

        $("#inputProfilePicture").val("");
        $("#" + SignupForm.dropzoneId).html("");

    }

    this.uploadFinished = function(file, response) {

        if(response.file) {

            $("#uploadLoader").hide();

            $("#" + SignupForm.dropzoneId).html('<img src="' + encodeURI(SignupForm.uploadPath + "/" + response.file.name) + '">');
            $("#inputProfilePicture").val(SignupForm.uploadPath + "/" + response.file.name);

        }

    }

    this.dragStart = function() {
        $("#uploadLoader").show();
    }

    this.dragOver = function() {
        $(".dropper").css("border", "5px dotted #cccccc");
    }

    this.dragEnd = function() {
        $(".dropper").css("border", "5px dotted #ffffff");
    }

    this.drop = function() {
        $(".dropper").css("border", "5px dotted #ffffff");
    }

    this.totalUploadProgress = function(progress, totalBytes, totalBytesSent) {}

    this.submitForm = function() {

        if($("#inputUsername").val().length == 0) {
            toastr.error("Please enter your username");
        }
        else if($("#inputPassword").val().length == 0) {
            toastr.error("Please enter your password");
        }
        else if($("#inputEmail").val().length == 0) {
            toastr.error("Please enter your password");
        }
        else if(!validateEmail($("#inputEmail").val())) {
            toastr.error("Email is not valid");
        }
        else if($("#inputProfilePicture").val().length == 0) {
            toastr.error("Please upload a profile picture");
        }
        else {
            //checking if username+email does not exist
            SignupForm.SockrageUser.list();
        }
    }
}

/**
 * Initialize a Dropzone
 * @param callback
 * @param dragStartFn
 * @param dragOverFn
 * @param dragEndFn
 * @param dragLeaveFn
 * @param dropFn
 * @param totalUploadProgressFn
 * @param queueCompleteFn
 * @param divId
 */
function initDropzone(callback, dragStartFn, dragOverFn, dragEndFn, dragLeaveFn, dropFn, totalUploadProgressFn, queueCompleteFn, divId) {

    Dropzone.options[divId] = {
        paramName: "file",
        previewsContainer: false,
        acceptedFiles: "image/*",
        processing: dragStartFn,
        dragover: function() {
            dragOverFn();
        },
        dragend: function() {
            dragEndFn();
        },
        dragleave: function() {
            dragLeaveFn();
        },
        drop: function() {
            dropFn();
        },
        success: function(file, response){
            callback(file, response);
        },
        totaluploadprogress: function(progress, totalBytes, totalBytesSent) {
            totalUploadProgressFn(progress, totalBytes, totalBytesSent);
        },
        completemultiple: function() {
            queueCompleteFn();
        }
    };

    new Dropzone("#" + divId, { url: "/upload"});

}

/**
 * Convert an image
 * to a base64 string
 * @param  {String}   url
 * @param  {Function} callback
 * @param  {String}   [outputFormat=image/png]
 */
function convertImgToBase64(url, callback, outputFormat){
    var canvas = document.createElement('CANVAS'),
        ctx = canvas.getContext('2d'),
        img = new Image;
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
        var dataURL;
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        callback.call(this, dataURL);
        canvas = null;
    };
    img.src = url;
}

/**
 * Validate an email with regex
 * @param email
 * @returns {boolean}
 */
function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
