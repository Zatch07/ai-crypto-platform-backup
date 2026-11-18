pipeline {
    agent any

    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        APP_NAME   = 'ai-crypto-platform'
        IMAGE_TAG  = "${APP_NAME}:${BUILD_NUMBER}"
        LATEST_TAG = "${APP_NAME}:latest"
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
                        // Securely inject .env from Jenkins "Secret file" credential (ID: crypto-env-file)
                        // This keeps all secrets out of git, commit history, and console logs.
                        withCredentials([file(credentialsId: 'crypto-env-file', variable: 'SECRET_ENV')]) {
                            sh 'cp $SECRET_ENV .env'
                            echo 'Successfully injected .env from Jenkins Credential Store (crypto-env-file).'
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
                echo "Building production Docker image: ${IMAGE_TAG}..."
                // Only pass NEXT_PUBLIC_* variables to build-args.
                // Private keys (CLERK_SECRET_KEY, SUPABASE_SECRET_KEY) are NEVER passed to build-args
                // so they are never embedded in the image layers or history.
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

        stage('Container Smoke Test') {
            steps {
                echo 'Performing pre-deployment smoke test...'
                script {
                    def testContainer = "test-${APP_NAME}-${BUILD_NUMBER}"
                    try {
                        sh "docker run -d --name ${testContainer} -p 3001:3000 --env-file .env ${LATEST_TAG}"
                        
                        // Probe container via direct Docker network IP or host mapping with retries
                        sh '''
                            CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ''' + testContainer + ''')
                            
                            for i in $(seq 1 10); do
                                if [ -n "$CONTAINER_IP" ] && curl -s -f "http://${CONTAINER_IP}:3000" > /dev/null; then
                                    echo "Smoke test passed via container IP (${CONTAINER_IP}:3000)!"
                                    exit 0
                                elif curl -s -f http://host.docker.internal:3001 > /dev/null 2>&1; then
                                    echo "Smoke test passed via host.docker.internal:3001!"
                                    exit 0
                                elif curl -s -f http://localhost:3001 > /dev/null 2>&1; then
                                    echo "Smoke test passed via localhost:3001!"
                                    exit 0
                                fi
                                echo "Waiting for container to initialize ($i/10)..."
                                sleep 2
                            done
                            echo "Smoke test failed: Container did not respond."
                            docker logs ''' + testContainer + '''
                            exit 1
                        '''
                    } finally {
                        sh "docker rm -f ${testContainer} || true"
                    }
                }
            }
        }

        stage('Deploy Live Container') {
            steps {
                echo 'Deploying live container on port 3000...'
                sh '''
                    docker stop ai-crypto-app || true
                    docker rm ai-crypto-app || true
                    docker run -d \
                        --name ai-crypto-app \
                        --restart unless-stopped \
                        -p 3000:3000 \
                        --env-file .env \
                        ${LATEST_TAG}
                '''
                echo 'Deployment successful! Application is running on http://localhost:3000'
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded! Image ${IMAGE_TAG} is live."
        }
        failure {
            echo 'Pipeline failed. Please inspect stage logs above.'
        }
        always {
            // Clean up injected .env file from the Jenkins agent workspace for security
            sh 'rm -f .env || true'
        }
    }
}
