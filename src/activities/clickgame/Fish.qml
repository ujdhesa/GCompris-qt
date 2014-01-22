import QtQuick 2.1
import QtQuick.Particles 2.0
import "activity.js" as Activity

AnimatedSprite {
    id: fish
    Component.onCompleted: x=900
    property int duration: 5000
    frameRate: 2
    interpolate: true

    transform: Rotation {
        id: rotate; origin.x: width / 2; origin.y: 0; axis { x: 0; y: 1; z: 0 } angle: 0
    }

    SequentialAnimation {
                id: rotateLeftAnimation
                loops: 1
                PropertyAnimation {
                    target: rotate
                    properties: "angle"
                    from: 0
                    to: 180
                    duration: 500
                }
    }

    SequentialAnimation {
                id: rotateRightAnimation
                loops: 1
                PropertyAnimation {
                    target: rotate
                    properties: "angle"
                    from: 180
                    to: 0
                    duration: 500
                }
    }
    onXChanged: {
        if(x > 600) {
            rotateLeftAnimation.start()
            x = 0
            y = Activity.getY(y)
            bubbleEffect.restart()
        } else if(x < 100) {
            rotateRightAnimation.start()
            x = 800
            bubbleEffect.restart()
        }
    }
    Behavior on x { PropertyAnimation { duration: fish.duration } }
    Behavior on y { PropertyAnimation { duration: fish.duration } }
    Behavior on opacity { PropertyAnimation { duration: 500 } }

    MouseArea {
        anchors.fill: parent
        onClicked: {
            parent.opacity = 0
            enabled = false
            Activity.fishKilled()
            clickedEffect.start()
        }
    }

    ParticleSystem
    {
        id: bubbleEffect
        anchors.fill: parent
        Emitter {
            x: parent.x + parent.width * 0.8
            y: parent.y + parent.height / 2
            width: 1
            height: 1
            emitRate: 0.5
            lifeSpan: 1000
            lifeSpanVariation: 2500
            acceleration: PointDirection {
                x: -10
                xVariation: 10
                y: -20
                yVariation: 10
            }
            velocity: PointDirection {
                x: -20
                xVariation: 10
                y: -20
                yVariation: 10
            }
            size: 12
            sizeVariation: 8
        }

        ImageParticle {
            source: "qrc:/gcompris/src/activities/clickgame/resource/bubble.png"
            sizeTable: "qrc:/gcompris/src/activities/clickgame/resource/sizeTable.png"
        }
    }

    ParticleSystem
    {
        id: clickedEffect
        anchors.fill: parent
        running: false
        Emitter {
            anchors.fill: parent
            emitRate: 100
            lifeSpan: 100
            lifeSpanVariation: 50
            size: 48
            sizeVariation: 20
        }

        ImageParticle {
            source: "qrc:/gcompris/src/activities/clickgame/resource/star.png"
            sizeTable: "qrc:/gcompris/src/activities/clickgame/resource/sizeTable.png"
            color: "white"
            blueVariation: 0.5
            greenVariation: 0.5
            redVariation: 0.5
        }
    }

}
