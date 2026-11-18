pipeline {
    agent any

    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    // Ping GitHub repository every 1 minute for code updates
    triggers {
        pollSCM('* * * * *')
    }

    environment {
        APP_NAME     = 'ai-crypto-platform'
        IMAGE_TAG    = "${APP_NAME}:${BUILD_NUMBER}"
        LATEST_TAG   = "${APP_NAME}:latest"
        NETWORK_NAME = 'crypto-network'
        PROXY_NAME   = 'ai-crypto-proxy'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Inject Secrets') {
            steps {
                script {
                    echo 'Injecting environment variables from Jenkins Credentials...'
                    try {
                        withCredentials([file(credentialsId: 'crypto-env-file', variable: 'SECRET_ENV')]) {
                            sh 'cp $SECRET_ENV .env'
                            echo 'Successfully injected .env from Jenkins Credential Store.'
                        }
                    } catch (Exception e) {
                        if (fileExists('.env')) {
                            echo 'Using existing .env file present in workspace.'
                        } else {
                            error('No .env found! Please add your .env file in Jenkins: Manage Jenkins > Credentials as a Secret file with ID: crypto-env-file')
                        }
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "Building Docker image: ${IMAGE_TAG}..."
                sh '''
                    set -a
                    . ./.env
                    set +a

                    docker build \
                        --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
                        --build-arg NEXT_PUBLIC_SUPABASE_URL \
                        --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
                        -t ${IMAGE_TAG} \
                        -t ${LATEST_TAG} \
                        .
                '''
            }
        }

        stage('Blue/Green Deployment') {
            steps {
                script {
                    echo 'Initiating Zero-Downtime Blue/Green Deployment...'

                    // 1. Ensure dedicated bridge network exists
                    sh "docker network create ${NETWORK_NAME} || true"

                    // 2. Identify currently active container (Blue vs Green)
                    def isBlueRunning = sh(script: "docker ps --filter 'name=ai-crypto-blue' --filter 'status=running' -q", returnStdout: true).trim()
                    def targetSlot = isBlueRunning ? 'green' : 'blue'
                    def activeSlot = isBlueRunning ? 'blue'  : 'green'
                    def targetContainer = "ai-crypto-${targetSlot}"
                    def activeContainer = "ai-crypto-${activeSlot}"

                    echo "Currently Active Slot: ${isBlueRunning ? 'BLUE' : 'GREEN'}"
                    echo "Deploying New Version To: ${targetSlot.toUpperCase()} (${targetContainer})"

                    // 3. Clean up any stale container on the target slot and deploy new version
                    sh """
                        docker rm -f ${targetContainer} || true
                        docker run -d \
                            --name ${targetContainer} \
                            --network ${NETWORK_NAME} \
                            --restart unless-stopped \
                            --env-file .env \
                            ${LATEST_TAG}
                    """

                    // 4. Smoke Test the new container on /api/health before cutting traffic
                    echo "Validating health of ${targetContainer} on /api/health..."
                    sh """
                        TARGET_IP=\$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${targetContainer})
                        
                        for i in \$(seq 1 12); do
                            if [ -n "\$TARGET_IP" ] && curl -s -f "http://\${TARGET_IP}:3000/api/health" | grep -q '"status":"UP"'; then
                                echo "Health check PASSED on \${targetContainer} (\${TARGET_IP}:3000)!"
                                exit 0
                            fi
                            echo "Waiting for \${targetContainer} to initialize (\$i/12)..."
                            sleep 2
                        done

                        echo "ERROR: Health check FAILED on \${targetContainer}. Rolling back..."
                        docker logs ${targetContainer}
                        docker rm -f ${targetContainer} || true
                        exit 1
                    """

                    // 5. Zero-Downtime Switchover via Nginx Reverse Proxy on port 3000
                    echo "Health check succeeded. Switching live traffic on port 3000 to ${targetContainer}..."
                    sh """
                        # Create Nginx routing configuration pointing to target container
                        NGINX_CONF="upstream app_upstream { server ${targetContainer}:3000; } server { listen 3000; location / { proxy_pass http://app_upstream; proxy_http_version 1.1; proxy_set_header Upgrade \\\$http_upgrade; proxy_set_header Connection 'upgrade'; proxy_set_header Host \\\$host; proxy_set_header X-Real-IP \\\$remote_addr; proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \\\$scheme; } }"

                        # If Nginx proxy container is not running, start it
                        if ! docker ps --filter "name=${PROXY_NAME}" --filter "status=running" -q | grep -q .; then
                            echo "Initializing Nginx reverse proxy on port 3000..."
                            docker rm -f ${PROXY_NAME} || true
                            docker run -d \
                                --name ${PROXY_NAME} \
                                --network ${NETWORK_NAME} \
                                -p 3000:3000 \
                                --restart unless-stopped \
                                nginx:alpine

                            sleep 2
                        fi

                        # Atomically reload Nginx configuration (0ms downtime)
                        docker exec ${PROXY_NAME} sh -c "echo '\$NGINX_CONF' > /etc/nginx/conf.d/default.conf && nginx -s reload"
                        echo "Live traffic successfully switched to ${targetContainer} on port 3000!"
                    """

                    // 6. Gracefully decommission the previous active slot
                    if (isBlueRunning || sh(script: "docker ps --filter 'name=${activeContainer}' --filter 'status=running' -q", returnStdout: true).trim()) {
                        echo "Stopping and removing previous container: ${activeContainer}..."
                        sh "docker stop ${activeContainer} || true"
                        sh "docker rm ${activeContainer} || true"
                    }

                    echo "Zero-Downtime Blue/Green deployment complete! Active: ${targetSlot.toUpperCase()}"
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded! New version is serving on http://localhost:3000"
        }
        failure {
            echo 'Pipeline failed. If deployment failed health check, traffic remained on previous active slot (auto-rollback).'
        }
        always {
            sh 'rm -f .env || true'
        }
    }
}
