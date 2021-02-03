let remoteVideo = document.querySelector("#remote")
let localVideo = document.querySelector("#local")
let localConnection, remoteConnection

let constrants = { video: true, audio: false }
window.navigator.mediaDevices.getUserMedia(constrants).then(stream => {
    localVideo.srcObject = stream
    startPeerConnection(stream)
})

function startPeerConnection(stream) {
    const configuration = {}
    remoteConnection = new RTCPeerConnection(configuration)
    localConnection = new RTCPeerConnection(configuration)

    localDataChannel = localConnection.createDataChannel("localLabel")


    localDataChannel.addEventListener("open", (e) => {
        localDataChannel.send("hi remote!")
    })
    localDataChannel.addEventListener("message", (e) => {
        console.log("receive from remote: ", e.data);
    })
    remoteConnection.addEventListener("datachannel", (e) => {
        let channel = e.channel
        channel.addEventListener("open", (e) => {
            channel.send("hi local!")
        })
        channel.addEventListener("message", (e) => {
            console.log("receive from local: ", e.data);
        })
    })
    // 发送本地流
    for (const track of stream.getTracks()) {
        localConnection.addTrack(track, stream);
    }
    // 监听远程流
    remoteConnection.addEventListener("track", (e) => {
        remoteVideo.srcObject = e.streams[0]
    })

    // 交换ice候选
    localConnection.onicecandidate = function (e) {

        if (e.candidate) {
            console.log("local candidate", e.candidate);
            remoteConnection.addIceCandidate(new RTCIceCandidate(e.candidate))
        }
    }
    remoteConnection.onicecandidate = function (e) {
        if (e.candidate) {
            console.log("remote candidate", e.candidate);
            localConnection.addIceCandidate(new RTCIceCandidate(e.candidate))
        }
    }

    // 交换会话描述offer answer
    localConnection.createOffer().then(offer => {
        console.log("offer", offer);
        localConnection.setLocalDescription(new RTCSessionDescription(offer))
        remoteConnection.setRemoteDescription(new RTCSessionDescription(offer))
        remoteConnection.createAnswer().then(answer => {
            console.log("answer", answer);
            remoteConnection.setLocalDescription(new RTCSessionDescription(answer))
            localConnection.setRemoteDescription(new RTCSessionDescription(answer))
        })
    })
}